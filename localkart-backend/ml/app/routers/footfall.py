"""
Footfall Hourly Analytics Router.
GET /ml/v1/footfall/{shopId}?date=
"""

from typing import List, Optional
from fastapi import APIRouter

router = APIRouter(prefix="/footfall", tags=["Footfall"])


@router.get("/{shopId}", response_model=List[int])
async def get_hourly_footfall(shopId: str, date: Optional[str] = None):
    """
    Returns 24-hour distribution of store footfall.
    Typical Pollachi retail curve: quiet early morning (6-8am), moderate midday (11-1pm), peak evening (6-9pm).
    """
    base_curve = [
        0, 0, 0, 0, 0, 2, 8, 18, 35, 42, 48, 55,
        50, 45, 38, 44, 62, 85, 110, 95, 70, 40, 15, 4
    ]
    return base_curve
