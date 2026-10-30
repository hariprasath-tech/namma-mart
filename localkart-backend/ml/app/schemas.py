"""
LocalKart ML Service Pydantic Schemas.
Strictly matching shared/ml.schema.json and frontend src/types/ml.ts
"""

from typing import List, Optional, Literal
from pydantic import BaseModel, Field


class ModelMeta(BaseModel):
    model: str
    version: str
    source: Literal["pretrained", "fine-tuned", "synthetic", "baseline"]
    generatedAt: Optional[str] = None
    stale: Optional[bool] = False


class BoundingBox(BaseModel):
    label: str
    qty: int = Field(ge=0)
    confidence: float = Field(ge=0.0, le=1.0)
    bbox: List[float] = Field(min_length=4, max_length=4)  # [x, y, width, height] normalized percent


class ShelfGap(BaseModel):
    slot: str
    productId: str
    missing: int = Field(ge=1)


class ShelfStatus(BaseModel):
    cameraId: str
    capturedAt: str
    boxes: List[BoundingBox]
    gaps: List[ShelfGap]
    meta: Optional[ModelMeta] = None


class QueueStatus(BaseModel):
    counterId: str
    length: int = Field(ge=0)
    waitMins: float = Field(ge=0.0)


class CrowdSnapshot(BaseModel):
    peopleNow: int = Field(ge=0)
    level: Literal["quiet", "moderate", "busy"]
    queues: List[QueueStatus]
    meta: Optional[ModelMeta] = None


class ZoneDensity(BaseModel):
    zoneId: str
    count: int = Field(ge=0)
    dwellMins: float = Field(ge=0.0)


class ForecastPoint(BaseModel):
    date: str
    expected: float = Field(ge=0.0)
    low: float = Field(ge=0.0)
    high: float = Field(ge=0.0)


class ProductPair(BaseModel):
    productA: str
    productB: str
    frequency: float
    suggestion: str
    support: Optional[float] = None
    confidence: Optional[float] = None
    lift: Optional[float] = None


class LostDemandItem(BaseModel):
    query: str
    category: str
    searchCount: int
    requestCount: int
    totalScore: int
    trending: bool
