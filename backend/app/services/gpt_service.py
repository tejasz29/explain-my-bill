from __future__ import annotations

import json
import os
import re
from typing import Any

from openai import APIError, OpenAI, RateLimitError
from pydantic import ValidationError

from app.config import DEFAULT_MODEL_NAME
from app.schemas import BillAnalysisResponse


GROQ_BASE_URL = "https://api.groq.com/openai/v1"


class GPTServiceError(Exception):
    pass


class GPTQuotaError(GPTServiceError):
    pass

SYSTEM_PROMPT = """
You analyze consumer bills and explain charges in clear, plain language.

Return ONLY strict JSON with this exact shape:
{
  "total_amount": number,
  "currency": string,
  "items": [
    {
      "name": string,
      "amount": number,
      "explanation": string,
      "flagged": boolean,
      "flag_reason": string | null
    }
  ],
  "anomalies": [string],
  "summary": string
}

Rules:
- Do not wrap the JSON in markdown.
- Keep explanations concise and easy for a non-expert to understand.
- Mark "flagged" true only when something plausibly looks unusual, duplicative, unclear, or excessive.
- If nothing seems suspicious, return an empty anomalies array and flagged=false for normal items.
- Use the currency shown in the bill when possible.
- Make sure numeric fields are numbers, not strings.
- Return a single valid JSON object and nothing before or after it.
""".strip()


def _get_client() -> OpenAI:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise GPTServiceError("GROQ_API_KEY is not configured on the server.")

    return OpenAI(api_key=api_key, base_url=GROQ_BASE_URL)


def _get_model_name() -> str:
    return os.getenv("GROQ_MODEL", DEFAULT_MODEL_NAME)


def _strip_code_fences(raw_text: str) -> str:
    cleaned = raw_text.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)
    return cleaned.strip()


def _extract_json_object(raw_text: str) -> str:
    cleaned = _strip_code_fences(raw_text)

    try:
        json.loads(cleaned)
        return cleaned
    except json.JSONDecodeError:
        pass

    start = cleaned.find("{")
    if start == -1:
        return cleaned

    depth = 0
    in_string = False
    escape = False

    for index in range(start, len(cleaned)):
        char = cleaned[index]

        if in_string:
            if escape:
                escape = False
            elif char == "\\":
                escape = True
            elif char == '"':
                in_string = False
            continue

        if char == '"':
            in_string = True
        elif char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
            if depth == 0:
                return cleaned[start : index + 1]

    return cleaned


def _parse_response_payload(raw_text: str) -> BillAnalysisResponse:
    cleaned = _extract_json_object(raw_text)

    try:
        payload: Any = json.loads(cleaned)
    except json.JSONDecodeError as exc:
        raise ValueError("The model returned malformed JSON.") from exc

    try:
        return BillAnalysisResponse.model_validate(payload)
    except ValidationError as exc:
        raise ValueError("The model response did not match the expected schema.") from exc


def analyze_bill_text(extracted_text: str) -> BillAnalysisResponse:
    client = _get_client()
    model_name = _get_model_name()

    try:
        response = client.responses.create(
            model=model_name,
            instructions=SYSTEM_PROMPT,
            text={"format": {"type": "json_object"}},
            input=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "input_text",
                            "text": (
                                "Analyze this bill text. Extract the line items, explain them, "
                                "and flag anything that looks suspicious.\n\n"
                                f"Bill text:\n{extracted_text}"
                            ),
                        }
                    ],
                }
            ],
        )
    except RateLimitError as exc:
        raise GPTQuotaError(
            "Groq quota or rate limit exceeded. Please check your Groq plan and billing details."
        ) from exc
    except APIError as exc:
        raise GPTServiceError(f"Groq API request failed: {exc}") from exc

    return _parse_response_payload(response.output_text)


def analyze_bill_image(image_data_url: str) -> BillAnalysisResponse:
    client = _get_client()
    model_name = _get_model_name()

    try:
        response = client.responses.create(
            model=model_name,
            instructions=SYSTEM_PROMPT,
            text={"format": {"type": "json_object"}},
            input=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "input_text",
                            "text": (
                                "Analyze this bill image. Extract the line items, explain them, "
                                "and flag anything that looks suspicious."
                            ),
                        },
                        {
                            "type": "input_image",
                            "image_url": image_data_url,
                            "detail": "high",
                        },
                    ],
                }
            ],
        )
    except RateLimitError as exc:
        raise GPTQuotaError(
            "Groq quota or rate limit exceeded. Please check your Groq plan and billing details."
        ) from exc
    except APIError as exc:
        raise GPTServiceError(f"Groq API request failed: {exc}") from exc

    return _parse_response_payload(response.output_text)
