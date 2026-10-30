"""
Smart Shelf Gap Finder (Pure Geometry).
Computes planogram slot coverage against detected product bounding boxes.
No neural network dependencies - pure computational geometry.
"""

from typing import List, Dict, Any, Tuple
from app.schemas import ShelfGap


def box_area(box: List[float]) -> float:
    """Calculate area of normalized [x, y, w, h] box."""
    return max(0.0, box[2]) * max(0.0, box[3])


def intersection_area(boxA: List[float], boxB: List[float]) -> float:
    """Calculate intersection area between boxA and boxB [x, y, w, h]."""
    xA = max(boxA[0], boxB[0])
    yA = max(boxA[1], boxB[1])
    xB = min(boxA[0] + boxA[2], boxB[0] + boxB[2])
    yB = min(boxA[1] + boxA[3], boxB[1] + boxB[3])

    interW = max(0.0, xB - xA)
    interH = max(0.0, yB - yA)
    return interW * interH


def find_shelf_gaps(
    planogram: List[Dict[str, Any]],
    detected_boxes: List[Dict[str, Any]],
    coverage_threshold: float = 0.65
) -> List[ShelfGap]:
    """
    Given planogram slots and detected item boxes, determines missing facings.
    Each slot in planogram:
      - slot: str (e.g. "slot_A1")
      - productId: str
      - expectedFacings: int (e.g. 5)
      - bbox: [x, y, w, h]
    """
    gaps: List[ShelfGap] = []

    for slot in planogram:
        slot_id = slot.get("slot") or slot.get("id", "slot_unknown")
        product_id = slot.get("productId", "unknown")
        expected = int(slot.get("expectedFacings", 1))
        slot_bbox = slot.get("bbox", [0.0, 0.0, 1.0, 1.0])
        s_area = box_area(slot_bbox)

        if s_area <= 0 or expected <= 0:
            continue

        # Count detected boxes that fall inside this slot
        # A box is in the slot if its centroid is inside or has >50% overlap with the slot
        detected_count = 0
        total_overlap = 0.0

        for box_item in detected_boxes:
            b_box = box_item.get("bbox", [0.0, 0.0, 0.0, 0.0])
            b_area = box_area(b_box)
            if b_area <= 0:
                continue

            inter = intersection_area(slot_bbox, b_box)
            if inter > 0:
                total_overlap += inter
                # Check if centroid is inside slot
                cx = b_box[0] + b_box[2] / 2.0
                cy = b_box[1] + b_box[3] / 2.0
                if (slot_bbox[0] <= cx <= slot_bbox[0] + slot_bbox[2]) and \
                   (slot_bbox[1] <= cy <= slot_bbox[1] + slot_bbox[3]):
                    detected_count += 1

        # Also estimate count by coverage area ratio
        fraction_covered = total_overlap / s_area
        estimated_by_area = round(fraction_covered * expected)

        # Take the maximum of centroid count and area estimate (capped at expected)
        effective_detected = min(expected, max(detected_count, estimated_by_area))

        missing = expected - effective_detected
        if missing >= 1:
            gaps.append(
                ShelfGap(
                    slot=slot_id,
                    productId=product_id,
                    missing=missing
                )
            )

    return gaps
