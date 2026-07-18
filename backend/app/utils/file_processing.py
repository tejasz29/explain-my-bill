from __future__ import annotations

import base64
import io
from pathlib import Path

import pdfplumber
from fastapi import UploadFile


ALLOWED_CONTENT_TYPES = {
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
}

ALLOWED_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png", ".webp"}


def detect_file_kind(upload_file: UploadFile) -> str:
    extension = Path(upload_file.filename or "").suffix.lower()
    content_type = (upload_file.content_type or "").lower()

    if extension not in ALLOWED_EXTENSIONS and content_type not in ALLOWED_CONTENT_TYPES:
        raise ValueError("Unsupported file type. Please upload a PDF, PNG, JPG, or WEBP file.")

    if extension == ".pdf" or content_type == "application/pdf":
        return "pdf"

    return "image"


def extract_pdf_text(file_bytes: bytes) -> str:
    chunks: list[str] = []

    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text() or ""
            if page_text.strip():
                chunks.append(page_text.strip())

    return "\n\n".join(chunks).strip()


def encode_image_base64(file_bytes: bytes) -> str:
    return base64.b64encode(file_bytes).decode("utf-8")


def build_data_url(upload_file: UploadFile, file_bytes: bytes) -> str:
    content_type = upload_file.content_type or "image/png"
    return f"data:{content_type};base64,{encode_image_base64(file_bytes)}"
