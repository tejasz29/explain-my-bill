from __future__ import annotations

import base64
import io

import pdfplumber

from app.config import Settings


ALLOWED_CONTENT_TYPES = {
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
}

ALLOWED_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png", ".webp"}
PDF_SIGNATURE = b"%PDF"
JPEG_SIGNATURE = b"\xff\xd8\xff"
PNG_SIGNATURE = b"\x89PNG\r\n\x1a\n"
WEBP_RIFF_SIGNATURE = b"RIFF"
WEBP_FORMAT_SIGNATURE = b"WEBP"


def _get_extension(filename: str | None) -> str:
    if not filename or "." not in filename:
        return ""
    return f".{filename.rsplit('.', 1)[-1].lower()}"


def _sniff_file_kind(file_bytes: bytes) -> str:
    if file_bytes.startswith(PDF_SIGNATURE):
        return "pdf"
    if file_bytes.startswith(JPEG_SIGNATURE):
        return "image"
    if file_bytes.startswith(PNG_SIGNATURE):
        return "image"
    if file_bytes.startswith(WEBP_RIFF_SIGNATURE) and file_bytes[8:12] == WEBP_FORMAT_SIGNATURE:
        return "image"
    raise ValueError(
        "Unsupported file content. Please upload a valid PDF, PNG, JPG, or WEBP file."
    )


def sniff_content_type(file_bytes: bytes) -> str:
    if file_bytes.startswith(PDF_SIGNATURE):
        return "application/pdf"
    if file_bytes.startswith(JPEG_SIGNATURE):
        return "image/jpeg"
    if file_bytes.startswith(PNG_SIGNATURE):
        return "image/png"
    if file_bytes.startswith(WEBP_RIFF_SIGNATURE) and file_bytes[8:12] == WEBP_FORMAT_SIGNATURE:
        return "image/webp"
    raise ValueError(
        "Unsupported file content. Please upload a valid PDF, PNG, JPG, or WEBP file."
    )


def detect_file_kind(filename: str | None, content_type: str | None, file_bytes: bytes) -> str:
    extension = _get_extension(filename)
    normalized_content_type = (content_type or "").lower()

    if (
        extension not in ALLOWED_EXTENSIONS
        and normalized_content_type not in ALLOWED_CONTENT_TYPES
    ):
        raise ValueError("Unsupported file type. Please upload a PDF, PNG, JPG, or WEBP file.")

    sniffed_kind = _sniff_file_kind(file_bytes)
    expected_kind = "pdf" if extension == ".pdf" or normalized_content_type == "application/pdf" else "image"

    if sniffed_kind != expected_kind:
        raise ValueError("File extension or MIME type does not match the uploaded content.")

    return sniffed_kind


def validate_upload_bytes(
    filename: str | None,
    content_type: str | None,
    file_bytes: bytes,
    settings: Settings,
) -> str:
    if not file_bytes:
        raise ValueError("The uploaded file is empty.")

    if len(file_bytes) > settings.max_upload_size_bytes:
        max_size_mb = settings.max_upload_size_bytes / (1024 * 1024)
        raise ValueError(f"File too large. Maximum supported size is {max_size_mb:.1f} MB.")

    return detect_file_kind(filename, content_type, file_bytes)


def extract_pdf_text(file_bytes: bytes, max_pages: int) -> str:
    chunks: list[str] = []

    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        if len(pdf.pages) > max_pages:
            raise ValueError(
                f"PDF has too many pages. Maximum supported length is {max_pages} pages."
            )
        for page in pdf.pages:
            page_text = page.extract_text() or ""
            if page_text.strip():
                chunks.append(page_text.strip())

    return "\n\n".join(chunks).strip()


def is_scanned_pdf_text(text: str, min_characters: int) -> bool:
    return len(text.strip()) < min_characters


def encode_image_base64(file_bytes: bytes) -> str:
    return base64.b64encode(file_bytes).decode("utf-8")


def build_data_url(file_bytes: bytes) -> str:
    content_type = sniff_content_type(file_bytes)
    return f"data:{content_type};base64,{encode_image_base64(file_bytes)}"
