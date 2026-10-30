"""
Zone Density Counter using Shapely.
Determines whether person centroids [x, y] fall within defined zone polygons.
"""

from typing import List, Tuple, Dict, Any
from shapely.geometry import Point, Polygon
from app.schemas import ZoneDensity


def count_people_in_zones(
    person_positions: List[Tuple[float, float]],
    zones: List[Dict[str, Any]]
) -> List[ZoneDensity]:
    """
    Given person coordinates [(x, y), ...] and store zones:
    [
      { "id": "zone-produce", "name": "Fresh Produce", "polygon": [[x1, y1], [x2, y2], ...] }
    ]
    Returns ZoneDensity items for each zone.
    """
    densities: List[ZoneDensity] = []

    for z in zones:
        zone_id = z.get("id") or z.get("zoneId", "unknown")
        poly_coords = z.get("polygon", [])
        
        if len(poly_coords) < 3:
            densities.append(ZoneDensity(zoneId=zone_id, count=0, dwellMins=0.0))
            continue

        poly = Polygon(poly_coords)
        count = 0

        for pos in person_positions:
            p = Point(pos[0], pos[1])
            # Contains or intersects boundary
            if poly.contains(p) or poly.touches(p):
                count += 1

        # Dwell time estimate based on zone type and density (TRL 3 approximation)
        dwell = round(2.0 + (count * 0.8), 1) if count > 0 else 0.0

        densities.append(
            ZoneDensity(
                zoneId=zone_id,
                count=count,
                dwellMins=dwell
            )
        )

    return densities
