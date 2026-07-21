from __future__ import annotations

import json
import os
import re
from typing import Any

from openai import APIError, OpenAI, RateLimitError
from pydantic import ValidationError

from app.schemas import BillAnalysisResponse


GROQ_BASE_URL = "https://api.groq.com/openai/v1"
DEFAULT_MODEL_NAME = "qwen/qwen3.6-27b"
DEFAULT_VISION_MODEL_NAME = "qwen/qwen3.6-27b"


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
        raise RuntimeError("GROQ_API_KEY is not set.")

    return OpenAI(api_key=api_key, base_url=GROQ_BASE_URL)


def _get_model_name(*, vision: bool = False) -> str:
    if vision:
        return os.getenv("GROQ_VISION_MODEL", DEFAULT_VISION_MODEL_NAME)
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
    if not os.getenv("GROQ_API_KEY"):
        return _demo_response()

    client = _get_client()
    model_name = _get_model_name()

    try:
        response = client.chat.completions.create(
            model=model_name,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": (
                        "Analyze this bill text. Extract the line items, explain them, "
                        "and flag anything that looks suspicious.\n\n"
                        f"Bill text:\n{extracted_text}"
                    ),
                },
            ],
            response_format={"type": "json_object"},
        )

        raw = response.choices[0].message.content
    except RateLimitError as exc:
        raise GPTQuotaError(
            "Groq quota or rate limit exceeded. Please check your Groq plan and billing details."
        ) from exc
    except APIError as exc:
        raise GPTServiceError(f"Groq API request failed: {exc}") from exc

    return _parse_response_payload(raw)


def analyze_bill_image(image_data_url: str) -> BillAnalysisResponse:
    if not os.getenv("GROQ_API_KEY"):
        return _demo_response()

    client = _get_client()
    model_name = _get_model_name(vision=True)

    try:
        response = client.chat.completions.create(
            model=model_name,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": (
                                "Analyze this bill image. Extract the line items, explain them, "
                                "and flag anything that looks suspicious."
                            ),
                        },
                        {
                            "type": "image_url",
                            "image_url": {"url": image_data_url, "detail": "high"},
                        },
                    ],
                },
            ],
            response_format={"type": "json_object"},
        )

        raw = response.choices[0].message.content
    except RateLimitError as exc:
        raise GPTQuotaError(
            "Groq quota or rate limit exceeded. Please check your Groq plan and billing details."
        ) from exc
    except APIError as exc:
        raise GPTServiceError(f"Groq API request failed: {exc}") from exc

    return _parse_response_payload(raw)


def _demo_response() -> BillAnalysisResponse:
    return BillAnalysisResponse(
        total_amount=184.27,
        currency="USD",
        items=[
            {
                "name": "Base Service Plan",
                "amount": 89.99,
                "explanation": "This is the monthly charge for your standard phone service plan, which includes unlimited talk and text, plus 5GB of high-speed data.",
                "flagged": False,
                "flag_reason": None,
            },
            {
                "name": "Regulatory Recovery Fee",
                "amount": 11.50,
                "explanation": "A fee the carrier charges to recover costs related to government regulations, such as FCC compliance and universal service fund contributions.",
                "flagged": True,
                "flag_reason": "This fee looks unusually high compared to the standard $3-5 range. Consider questioning this charge.",
            },
            {
                "name": "Device Protection Add-on",
                "amount": 19.99,
                "explanation": "Monthly premium for insurance that covers screen repairs, battery replacements, and device theft or loss.",
                "flagged": True,
                "flag_reason": "You may already have device protection through your credit card or home insurance. This could be duplicate coverage.",
            },
            {
                "name": "Local Taxes and Surcharges",
                "amount": 7.79,
                "explanation": "State and local taxes applied to telecommunication services, including sales tax and municipal fees.",
                "flagged": False,
                "flag_reason": None,
            },
            {
                "name": "Premium Voicemail",
                "amount": 8.00,
                "explanation": "An upgraded voicemail service that includes transcription, visual voicemail, and extended message storage.",
                "flagged": False,
                "flag_reason": None,
            },
            {
                "name": "Data Overage Fee",
                "amount": 47.00,
                "explanation": "A charge for exceeding your monthly 5GB data allowance by 4.7GB at $10 per additional gigabyte.",
                "flagged": True,
                "flag_reason": "This is a significant overage charge. Consider upgrading to a plan with more data to avoid these fees in the future.",
            },
        ],
        anomalies=[
            "Regulatory Recovery Fee is above industry standard",
            "Device Protection may be duplicating existing coverage",
            "Data overage suggests a plan upgrade may save money",
        ],
        summary="Your total charge is $184.27. The largest cost is the Base Service Plan at $89.99. Three items have been flagged for potential issues: the Regulatory Recovery Fee appears higher than average, the Device Protection may duplicate existing coverage, and the Data Overage Fee suggests a plan with more data could save you money in the long run.",
    )