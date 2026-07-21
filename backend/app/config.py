from __future__ import annotations

import os
from dataclasses import dataclass


DEFAULT_MODEL_NAME = "qwen/qwen3.6-27b"
DEFAULT_ALLOWED_ORIGINS = ("http://localhost:3000", "http://127.0.0.1:3000")
DEFAULT_MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024
DEFAULT_MAX_PDF_PAGES = 12
DEFAULT_MIN_PDF_TEXT_CHARACTERS = 120
DEFAULT_RATE_LIMIT_REQUESTS = 5
DEFAULT_RATE_LIMIT_WINDOW_SECONDS = 600


@dataclass(frozen=True)
class Settings:
    groq_api_key: str | None
    groq_model: str
    allowed_origins: tuple[str, ...]
    max_upload_size_bytes: int
    max_pdf_pages: int
    min_pdf_text_characters: int
    rate_limit_requests: int
    rate_limit_window_seconds: int

    @property
    def groq_configured(self) -> bool:
        return bool(self.groq_api_key)


def _parse_csv_env(name: str, default: tuple[str, ...]) -> tuple[str, ...]:
    raw_value = os.getenv(name, "")
    if not raw_value.strip():
        return default

    values = tuple(item.strip() for item in raw_value.split(",") if item.strip())
    return values or default


def _parse_int_env(name: str, default: int) -> int:
    raw_value = os.getenv(name)
    if raw_value is None:
        return default

    try:
        parsed = int(raw_value)
    except ValueError as exc:
        raise RuntimeError(f"{name} must be an integer.") from exc

    if parsed <= 0:
        raise RuntimeError(f"{name} must be greater than zero.")

    return parsed


def get_settings() -> Settings:
    return Settings(
        groq_api_key=os.getenv("GROQ_API_KEY"),
        groq_model=os.getenv("GROQ_MODEL", DEFAULT_MODEL_NAME),
        allowed_origins=_parse_csv_env("ALLOWED_ORIGINS", DEFAULT_ALLOWED_ORIGINS),
        max_upload_size_bytes=_parse_int_env(
            "MAX_UPLOAD_SIZE_BYTES", DEFAULT_MAX_UPLOAD_SIZE_BYTES
        ),
        max_pdf_pages=_parse_int_env("MAX_PDF_PAGES", DEFAULT_MAX_PDF_PAGES),
        min_pdf_text_characters=_parse_int_env(
            "MIN_PDF_TEXT_CHARACTERS", DEFAULT_MIN_PDF_TEXT_CHARACTERS
        ),
        rate_limit_requests=_parse_int_env(
            "RATE_LIMIT_REQUESTS", DEFAULT_RATE_LIMIT_REQUESTS
        ),
        rate_limit_window_seconds=_parse_int_env(
            "RATE_LIMIT_WINDOW_SECONDS", DEFAULT_RATE_LIMIT_WINDOW_SECONDS
        ),
    )
