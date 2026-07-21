from __future__ import annotations

import os

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from app.schemas import BillAnalysisResponse
from app.services.gpt_service import (
    GPTQuotaError,
    GPTServiceError,
    analyze_bill_image,
    analyze_bill_text,
)
from app.utils.file_processing import build_data_url, detect_file_kind, extract_pdf_text


app = FastAPI(title="Explain My Bill API")

ALLOWED_ORIGINS = os.getenv("CORS_ORIGINS", "*").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
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
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/analyze-bill", response_model=BillAnalysisResponse)
async def analyze_bill(file: UploadFile = File(...)) -> BillAnalysisResponse:
    try:
        file_kind = detect_file_kind(file)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="The uploaded file is empty.")

    try:
        if file_kind == "pdf":
            extracted_text = extract_pdf_text(file_bytes)
            if not extracted_text:
                raise HTTPException(
                    status_code=400,
                    detail="Could not extract readable text from this PDF.",
                )
            return analyze_bill_text(extracted_text)

        image_data_url = build_data_url(file, file_bytes)
        return analyze_bill_image(image_data_url)
    except HTTPException:
        raise
    except GPTQuotaError as exc:
        raise HTTPException(status_code=429, detail=str(exc)) from exc
    except GPTServiceError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Unexpected server error.") from exc
