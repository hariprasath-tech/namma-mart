"""
Queue Estimator Service.
Calculates customer queue length and estimated wait times based on billing zone occupants.
Formula: waitMins = queue_length * avg_service_mins (Little's Law application)
"""

from typing import List, Dict, Any, Tuple
from shapely.geometry import Point, Polygon
from app.schemas import QueueStatus


def estimate_queues(
    person_positions: List[Tuple[float, float]],
    billing_counters: List[Dict[str, Any]],
    default_service_mins: float = 2.5
) -> List[QueueStatus]:
    """
    Given person coordinates and billing counters:
    [
      { "counterId": "counter_1", "polygon": [[x1, y1], [x2, y2], ...], "avgServiceMins": 2.5 }
    ]
    Returns QueueStatus for each counter.
    """
    queues: List[QueueStatus] = []

    for counter in billing_counters:
        counter_id = counter.get("counterId") or counter.get("id", "counter_1")
        service_time = float(counter.get("avgServiceMins", default_service_mins))
        poly_coords = counter.get("polygon", [])

        length = 0
        if len(poly_coords) >= 3:
            poly = Polygon(poly_coords)
            for pos in person_positions:
                p = Point(pos[0], pos[1])
                if poly.contains(p) or poly.touches(p):
                    length += 1

        wait_mins = round(length * service_time, 1)
        queues.append(
            QueueStatus(
                counterId=counter_id,
                length=length,
                waitMins=wait_mins
            )
        )

    return queues
