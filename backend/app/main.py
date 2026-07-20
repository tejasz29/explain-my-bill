from __future__ import annotations

import asyncio

from fastapi import FastAPI, File, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.rate_limiter import InMemoryRateLimiter
from app.schemas import AnalyzeBillEnvelope
from app.services.gpt_service import (
    GPTNotBillError,
    GPTQuotaError,
    GPTServiceError,
    analyze_bill_image,
    analyze_bill_text,
)
from app.utils.file_processing import (
    build_data_url,
    extract_pdf_text,
    is_scanned_pdf_text,
    validate_upload_bytes,
)


settings = get_settings()
rate_limiter = InMemoryRateLimiter()
app = FastAPI(title="Explain My Bill API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.allowed_origins),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root() -> dict[str, str]:
    return {
        "message": "Explain My Bill API is running.",
        "health_check": "/api/health",
        "analyze_endpoint": "/api/analyze-bill",
    }


@app.get("/api/health")
def health_check() -> dict[str, str | bool]:
    return {
        "status": "ok" if settings.groq_configured else "degraded",
        "groq_configured": settings.groq_configured,
        "rate_limiting_enabled": True,
    }


def _get_rate_limit_key(request: Request) -> str:
    forwarded_for = request.headers.get("x-forwarded-for", "")
    if forwarded_for.strip():
        return forwarded_for.split(",")[0].strip()
    if request.client and request.client.host:
        return request.client.host
    return "anonymous"


@app.post("/api/analyze-bill", response_model=AnalyzeBillEnvelope)
async def analyze_bill(
    request: Request, file: UploadFile = File(...)
) -> AnalyzeBillEnvelope:
    limit_status = rate_limiter.check(
        key=_get_rate_limit_key(request),
        limit=settings.rate_limit_requests,
        window_seconds=settings.rate_limit_window_seconds,
    )
    if not limit_status.allowed:
        raise HTTPException(
            status_code=429,
            detail=(
                "Too many analysis requests right now. Please wait a few minutes and try again."
            ),
        )

    file_bytes = await file.read()

    try:
        file_kind = validate_upload_bytes(
            file.filename,
            file.content_type,
            file_bytes,
            settings,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    try:
        if file_kind == "pdf":
            extracted_text = extract_pdf_text(file_bytes, settings.max_pdf_pages)
            if is_scanned_pdf_text(extracted_text, settings.min_pdf_text_characters):
                raise HTTPException(
                    status_code=422,
                    detail=(
                        "This PDF looks like a scanned image without enough readable text. "
                        "Please upload a clear photo, screenshot, or text-based PDF instead."
                    ),
                )
            if not extracted_text:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        "Could not extract readable text from this PDF. "
                        "Please upload a text-based PDF or a clear image of the bill."
                    ),
                )
            analysis = await asyncio.to_thread(analyze_bill_text, extracted_text)
            return AnalyzeBillEnvelope(success=True, data=analysis)

        image_data_url = build_data_url(file_bytes)
        analysis = await asyncio.to_thread(analyze_bill_image, image_data_url)
        return AnalyzeBillEnvelope(success=True, data=analysis)
    except HTTPException:
        raise
    except GPTNotBillError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except GPTQuotaError as exc:
        raise HTTPException(status_code=429, detail=str(exc)) from exc
    except GPTServiceError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Unexpected server error.") from exc
