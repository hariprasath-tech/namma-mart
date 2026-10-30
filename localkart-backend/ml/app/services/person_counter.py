"""
Person Counter and Crowd Intelligence Service.
Detects people, tracks line crossings, and calculates occupancy level.
Zero facial data or raw frames stored.
"""

from typing import List, Tuple, Dict, Any, Literal
from app.schemas import CrowdSnapshot, QueueStatus, ModelMeta
from app.services.queue_estimator import estimate_queues


def classify_crowd(people_now: int, capacity_hint: int = 30) -> Literal["quiet", "moderate", "busy"]:
    """
    Classifies crowd level based on capacity ratio.
    Must maintain exact 1:1 cross-language parity with Fastify lib/business.ts.
    Thresholds:
      ratio < 0.35 -> quiet
      0.35 <= ratio <= 0.75 -> moderate
      ratio > 0.75 -> busy
    """
    if capacity_hint <= 0:
        capacity_hint = 30
    ratio = people_now / capacity_hint
    if ratio < 0.35:
        return "quiet"
    if ratio <= 0.75:
        return "moderate"
    return "busy"


class LineCrossingTracker:
    """
    Simple IoU/centroid tracker for counting entries and exits across a vertical/horizontal boundary.
    """
    def __init__(self, line_coord: float = 0.5, orientation: str = "horizontal"):
        self.line_coord = line_coord
        self.orientation = orientation
        self.previous_positions: Dict[int, float] = {}
        self.entries = 0
        self.exits = 0

    def update(self, current_tracks: List[Tuple[int, float, float]]) -> Tuple[int, int]:
        """
        Takes tracks [(track_id, x, y), ...] and updates crossing counts.
        """
        for track_id, x, y in current_tracks:
            val = y if self.orientation == "horizontal" else x
            prev = self.previous_positions.get(track_id)
            
            if prev is not None:
                # Crossed line downwards / rightwards = entry
                if prev < self.line_coord and val >= self.line_coord:
                    self.entries += 1
                # Crossed line upwards / leftwards = exit
                elif prev > self.line_coord and val <= self.line_coord:
                    self.exits += 1

            self.previous_positions[track_id] = val

        return self.entries, self.exits
