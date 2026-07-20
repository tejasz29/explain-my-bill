from __future__ import annotations

from typing import Any, List, Literal, Optional

from pydantic import BaseModel, Field, field_validator, model_validator


def _coerce_amount(value: Any) -> float:
    if isinstance(value, (int, float)):
        return float(value)

    if isinstance(value, str):
        cleaned = (
            value.strip()
            .replace(",", "")
            .replace("$", "")
            .replace("USD", "")
            .replace("usd", "")
        )
        return float(cleaned)

    raise ValueError("Amount must be numeric.")


def _normalize_currency(value: str) -> str:
    normalized = value.strip().upper()
    aliases = {
        "$": "USD",
        "US$": "USD",
        "€": "EUR",
        "£": "GBP",
        "₹": "INR",
    }
    return aliases.get(normalized, normalized)


class BillItem(BaseModel):
    name: str = Field(..., min_length=1)
    amount: float
    explanation: str = Field(..., min_length=1)
    flagged: bool
    flag_reason: Optional[str] = None

    @field_validator("name", "explanation")
    @classmethod
    def _strip_text(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("Text fields cannot be empty.")
        return stripped

    @field_validator("amount", mode="before")
    @classmethod
    def _normalize_amount(cls, value: Any) -> float:
        return _coerce_amount(value)

    @field_validator("flag_reason")
    @classmethod
    def _normalize_flag_reason(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        stripped = value.strip()
        return stripped or None


class BillAnalysisResponse(BaseModel):
    total_amount: float
    currency: str = Field(..., min_length=1)
    items: List[BillItem]
    anomalies: List[str]
    summary: str = Field(..., min_length=1)

    @field_validator("total_amount", mode="before")
    @classmethod
    def _normalize_total_amount(cls, value: Any) -> float:
        return _coerce_amount(value)

    @field_validator("currency")
    @classmethod
    def _normalize_currency(cls, value: str) -> str:
        normalized = _normalize_currency(value)
        if not normalized:
            raise ValueError("Currency is required.")
        return normalized

    @field_validator("summary")
    @classmethod
    def _normalize_summary(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("Summary cannot be empty.")
        return stripped

    @field_validator("anomalies", mode="before")
    @classmethod
    def _normalize_anomalies(cls, value: Any) -> list[str]:
        if value is None:
            return []
        if not isinstance(value, list):
            raise ValueError("Anomalies must be a list.")
        return [str(item).strip() for item in value if str(item).strip()]


class RawBillAnalysisResponse(BaseModel):
    is_bill: bool
    error: Optional[str] = None
    total_amount: Any = 0
    currency: str = "USD"
    items: List[BillItem] = Field(default_factory=list)
    anomalies: List[str] = Field(default_factory=list)
    summary: str = ""

    @model_validator(mode="before")
    @classmethod
    def _normalize_bill_flag_aliases(cls, data: Any) -> Any:
        if not isinstance(data, dict):
            return data

        normalized = dict(data)
        if "is_bill" not in normalized and "isValidBill" in normalized:
            normalized["is_bill"] = normalized["isValidBill"]
        if "error" not in normalized and "message" in normalized:
            normalized["error"] = normalized["message"]
        return normalized

    def to_analysis_response(self) -> BillAnalysisResponse:
        return BillAnalysisResponse(
            total_amount=self.total_amount,
            currency=self.currency,
            items=self.items,
            anomalies=self.anomalies,
            summary=self.summary or "No bill analysis is available for this file.",
        )


class AnalyzeBillEnvelope(BaseModel):
    success: Literal[True]
    data: BillAnalysisResponse

