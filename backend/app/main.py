from __future__ import annotations

import asyncio

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.schemas import BillAnalysisResponse
from app.services.gpt_service import (
    GPTQuotaError,
    GPTServiceError,
    analyze_bill_image,
    analyze_bill_text,
)
from app.utils.file_processing import build_data_url, extract_pdf_text, validate_upload_bytes


settings = get_settings()
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
    }


@app.post("/api/analyze-bill", response_model=BillAnalysisResponse)
async def analyze_bill(file: UploadFile = File(...)) -> BillAnalysisResponse:
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
            if not extracted_text:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        "Could not extract readable text from this PDF. "
                        "Please upload a text-based PDF or a clear image of the bill."
                    ),
                )
            return await asyncio.to_thread(analyze_bill_text, extracted_text)

        image_data_url = build_data_url(file_bytes)
        return await asyncio.to_thread(analyze_bill_image, image_data_url)
    except HTTPException:
        raise
    except GPTQuotaError as exc:
        raise HTTPException(status_code=429, detail=str(exc)) from exc
    except GPTServiceError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Unexpected server error.") from exc
