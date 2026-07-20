from __future__ import annotations

import unittest

from app.config import Settings
from app.utils.file_processing import (
    build_data_url,
    detect_file_kind,
    validate_upload_bytes,
)


class DetectFileKindTests(unittest.TestCase):
    def test_accepts_pdf_with_matching_signature(self) -> None:
        file_kind = detect_file_kind("statement.pdf", "application/pdf", b"%PDF-1.7 sample")
        self.assertEqual(file_kind, "pdf")

    def test_rejects_mismatched_content(self) -> None:
        with self.assertRaises(ValueError):
            detect_file_kind("invoice.pdf", "application/pdf", b"plain text payload")

    def test_accepts_jpeg_by_signature(self) -> None:
        file_kind = detect_file_kind("bill.jpg", "image/jpeg", b"\xff\xd8\xff\xe0rest")
        self.assertEqual(file_kind, "image")

    def test_build_data_url_uses_sniffed_mime_type(self) -> None:
        data_url = build_data_url(b"\xff\xd8\xff\xe0rest")
        self.assertTrue(data_url.startswith("data:image/jpeg;base64,"))


class ValidateUploadBytesTests(unittest.TestCase):
    def setUp(self) -> None:
        self.settings = Settings(
            groq_api_key="test-key",
            groq_model="test-model",
            allowed_origins=("http://localhost:3000",),
            max_upload_size_bytes=32,
            max_pdf_pages=2,
            min_pdf_text_characters=100,
            rate_limit_requests=5,
            rate_limit_window_seconds=60,
        )

    def test_rejects_empty_upload(self) -> None:
        with self.assertRaises(ValueError):
            validate_upload_bytes("bill.pdf", "application/pdf", b"", self.settings)

    def test_rejects_oversized_upload(self) -> None:
        payload = b"x" * 33
        with self.assertRaises(ValueError):
            validate_upload_bytes("bill.jpg", "image/jpeg", payload, self.settings)


if __name__ == "__main__":
    unittest.main()
