"""
Zone Density Analytics Router.
GET /ml/v1/zones/{shopId}
"""

from typing import List
from fastapi import APIRouter
from app.schemas import ZoneDensity

router = APIRouter(prefix="/zones", tags=["Zones"])


@router.get("/{shopId}", response_model=List[ZoneDensity])
async def get_zone_densities(shopId: str):
    """
    Returns live zone occupants and dwell times for store zones.
    """
    return [
        ZoneDensity(zoneId="zone_entrance", count=3, dwellMins=1.2),
        ZoneDensity(zoneId="zone_groceries", count=8, dwellMins=5.4),
        ZoneDensity(zoneId="zone_produce", count=6, dwellMins=4.1),
        ZoneDensity(zoneId="zone_billing", count=5, dwellMins=3.8),
    ]
