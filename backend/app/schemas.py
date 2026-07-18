from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, Field


class BillItem(BaseModel):
    name: str = Field(..., min_length=1)
    amount: float
    explanation: str = Field(..., min_length=1)
    flagged: bool
    flag_reason: Optional[str] = None


class BillAnalysisResponse(BaseModel):
    total_amount: float
    currency: str = Field(..., min_length=1)
    items: List[BillItem]
    anomalies: List[str]
    summary: str = Field(..., min_length=1)

