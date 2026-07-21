from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel


class BillItem(BaseModel):
    name: str
    amount: float
    explanation: str
    flagged: bool
    flag_reason: Optional[str] = None


class BillAnalysisResponse(BaseModel):
    total_amount: float
    currency: str
    items: List[BillItem]
    anomalies: List[str]
    summary: str

