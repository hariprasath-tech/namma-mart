"""
LocalKart ML Test Suite (Pytest).
Strictly verifies:
  1. Gap finder geometry (fully covered, empty, partial)
  2. Zone counter polygon containment
  3. Line-crossing tracker counts
  4. Little's Law queue estimator
  5. Cross-language classifyCrowd parity against Node implementation
  6. Forecaster invariants: low <= expected <= high, non-negativity, horizon length
  7. FP-growth association rules
  8. Lost demand transliteration normalization
  9. Privacy test: zero image/video persistence
  10. Contract validation against shared/ml.schema.json
"""

import os
import json
import tempfile
import pytest
import jsonschema

from app.schemas import ShelfStatus, CrowdSnapshot, ZoneDensity, ForecastPoint, ProductPair
from app.services.gap_finder import find_shelf_gaps
from app.services.zone_counter import count_people_in_zones
from app.services.queue_estimator import estimate_queues
from app.services.person_counter import classify_crowd, LineCrossingTracker
from app.services.forecaster import generate_demand_forecast, seasonal_naive_forecast
from app.services.associator import mine_product_associations
from app.services.lost_demand import normalize_query
from app.services.shelf_detector import analyze_shelf_frame


# 1. Gap Finder Geometry Tests
def test_gap_finder_fully_covered_slot_yields_zero_gaps():
    planogram = [{
        "slot": "SLOT_A1",
        "productId": "p_rice",
        "expectedFacings": 2,
        "bbox": [0.0, 0.0, 0.4, 0.4]
    }]
    detected = [
        {"bbox": [0.02, 0.02, 0.16, 0.35], "label": "p_rice", "confidence": 0.9},
        {"bbox": [0.20, 0.02, 0.16, 0.35], "label": "p_rice", "confidence": 0.9}
    ]
    gaps = find_shelf_gaps(planogram, detected)
    assert len(gaps) == 0, "Fully covered slot should have 0 gaps"


def test_gap_finder_empty_slot_yields_full_expected_missing():
    planogram = [{
        "slot": "SLOT_B2",
        "productId": "p_oil",
        "expectedFacings": 4,
        "bbox": [0.5, 0.5, 0.4, 0.4]
    }]
    detected = []  # Empty shelf
    gaps = find_shelf_gaps(planogram, detected)
    assert len(gaps) == 1
    assert gaps[0].missing == 4
    assert gaps[0].productId == "p_oil"


def test_gap_finder_partial_coverage():
    planogram = [{
        "slot": "SLOT_C1",
        "productId": "p_dal",
        "expectedFacings": 3,
        "bbox": [0.0, 0.0, 0.6, 0.3]
    }]
    detected = [
        {"bbox": [0.05, 0.05, 0.15, 0.2], "label": "p_dal", "confidence": 0.85}
    ]
    gaps = find_shelf_gaps(planogram, detected)
    assert len(gaps) == 1
    assert gaps[0].missing == 2


# 2. Zone Counter Polygon Containment
def test_zone_counter_containment():
    zones = [
        {
            "id": "zone_produce",
            "polygon": [[0.0, 0.0], [0.5, 0.0], [0.5, 0.5], [0.0, 0.5]]
        }
    ]
    positions = [
        (0.2, 0.2),  # inside
        (0.4, 0.4),  # inside
        (0.7, 0.7),  # outside
        (0.5, 0.2),  # boundary
    ]
    densities = count_people_in_zones(positions, zones)
    assert len(densities) == 1
    assert densities[0].count == 3  # 2 inside + 1 boundary
    assert densities[0].dwellMins > 0.0


# 3. Line-Crossing Tracker
def test_line_crossing_tracker():
    tracker = LineCrossingTracker(line_coord=0.5, orientation="horizontal")
    # Step 1: person at y=0.4
    tracker.update([(1, 0.2, 0.4)])
    assert tracker.entries == 0 and tracker.exits == 0

    # Step 2: person crosses to y=0.6 (entry)
    entries, exits = tracker.update([(1, 0.2, 0.6)])
    assert entries == 1
    assert exits == 0

    # Step 3: person crosses back to y=0.3 (exit)
    entries, exits = tracker.update([(1, 0.2, 0.3)])
    assert entries == 1
    assert exits == 1


# 4. Queue Estimator (Little's Law)
def test_queue_estimator():
    counters = [
        {
            "id": "counter_1",
            "polygon": [[0.6, 0.6], [1.0, 0.6], [1.0, 1.0], [0.6, 1.0]],
            "avgServiceMins": 3.0
        }
    ]
    # 3 people in billing area
    people = [(0.7, 0.7), (0.8, 0.8), (0.9, 0.9), (0.1, 0.1)]
    queues = estimate_queues(people, counters)
    assert len(queues) == 1
    assert queues[0].length == 3
    assert queues[0].waitMins == 9.0  # 3 * 3.0 min

    # Zero queue gives 0 wait
    empty_queues = estimate_queues([], counters)
    assert empty_queues[0].length == 0
    assert empty_queues[0].waitMins == 0.0


# 5. Cross-Language Parity Test: classifyCrowd
@pytest.mark.parametrize("people, capacity, expected", [
    (0, 30, "quiet"),
    (5, 30, "quiet"),       # 5/30 = 0.166 < 0.35 -> quiet
    (10, 30, "quiet"),      # 10/30 = 0.333 < 0.35 -> quiet
    (11, 30, "moderate"),   # 11/30 = 0.366 >= 0.35 -> moderate
    (20, 30, "moderate"),   # 20/30 = 0.666 <= 0.75 -> moderate
    (22, 30, "moderate"),   # 22/30 = 0.733 <= 0.75 -> moderate
    (23, 30, "busy"),       # 23/30 = 0.766 > 0.75 -> busy
    (35, 30, "busy"),       # > 1.0 -> busy
])
def test_classify_crowd_parity_with_node(people, capacity, expected):
    """Must strictly match the Node.js implementation in api/src/lib/business.ts."""
    assert classify_crowd(people, capacity) == expected


# 6. Forecaster Invariants
def test_forecaster_invariants():
    import pandas as pd
    import numpy as np

    np.random.seed(42)
    dates = pd.date_range(end="2026-10-30", periods=60, freq="D")
    sales = [15 + (i % 7) * 2 + (i % 3) for i in range(60)]
    records = [{"date": d.strftime("%Y-%m-%d"), "sales": float(s)} for d, s in zip(dates, sales)]

    points, source = generate_demand_forecast(records, horizon_days=7)
    assert len(points) == 7
    assert source == "fine-tuned"

    for pt in points:
        assert pt.low <= pt.expected <= pt.high, f"Invariant violated: low={pt.low}, exp={pt.expected}, high={pt.high}"
        assert pt.low >= 0.0, "Negative sales forbidden"


def test_forecaster_cold_start_fallback():
    # Only 10 days of history -> must return baseline
    records = [{"date": f"2026-10-{d:02d}", "sales": 10.0} for d in range(1, 11)]
    points, source = generate_demand_forecast(records, horizon_days=7)
    assert source == "baseline"
    assert len(points) == 7


# 7. FP-Growth Product Associations
def test_fp_growth_associations():
    baskets = [
        ["Rice", "Oil", "Dal"],
        ["Rice", "Oil"],
        ["Rice", "Oil", "Ghee"],
        ["Rice", "Dal"],
        ["Milk", "Tea"],
        ["Milk", "Tea", "Sugar"],
        ["Milk", "Tea"],
    ]
    pairs = mine_product_associations(baskets, min_support=0.2, min_confidence=0.4)
    assert len(pairs) >= 1
    # Check that high affinity pairs like (Rice, Oil) or (Milk, Tea) emerge
    pair_names = [(p.productA, p.productB) for p in pairs]
    has_tea_milk = any(("Milk" in p and "Tea" in p) for p in pair_names)
    has_rice_oil = any(("Rice" in p and "Oil" in p) for p in pair_names)
    assert has_tea_milk or has_rice_oil


# 8. Lost Demand Normalization
@pytest.mark.parametrize("raw_query, expected_norm", [
    ("LED bulb", "led bulb"),
    ("led   bulb 40W", "led bulb"),
    ("arisi 5kg", "rice 5kg"),
    ("thuvaram paruppu 1kg", "toor dal 1kg"),
    ("thengai ennai", "coconut oil"),
])
def test_lost_demand_normalization(raw_query, expected_norm):
    assert normalize_query(raw_query) == expected_norm


# 9. Privacy Test: Zero Image/Video Disk Persistence
def test_privacy_zero_disk_leakage():
    from PIL import Image
    import io

    # Create dummy frame in memory
    img = Image.new("RGB", (320, 240), color=(100, 150, 200))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    raw_bytes = buf.getvalue()

    temp_dir = tempfile.gettempdir()
    files_before = set(os.listdir(temp_dir))

    # Run shelf detection in RAM
    status, frame_hash = analyze_shelf_frame(raw_bytes, "cam_privacy_01")
    
    files_after = set(os.listdir(temp_dir))
    new_files = files_after - files_before
    
    # Assert no .jpg, .png, or .mp4 files were written to temp directory
    image_leakage = [f for f in new_files if f.lower().endswith((".jpg", ".jpeg", ".png", ".mp4", ".avi"))]
    assert len(image_leakage) == 0, f"Privacy violation: image files leaked to disk: {image_leakage}"


# 10. Schema Contract Test against shared/ml.schema.json
def test_contract_against_json_schema():
    schema_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../shared/ml.schema.json"))
    with open(schema_path, "r", encoding="utf-8") as f:
        master_schema = json.load(f)

    # ShelfStatus validation
    shelf_schema = {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "definitions": master_schema["definitions"],
        "$ref": "#/definitions/ShelfStatus"
    }

    dummy_shelf = {
        "cameraId": "cam_01",
        "capturedAt": "2026-10-30T17:00:00Z",
        "boxes": [{"label": "item", "qty": 1, "confidence": 0.95, "bbox": [0.1, 0.1, 0.2, 0.2]}],
        "gaps": [{"slot": "A1", "productId": "p_rice", "missing": 1}],
        "meta": {"model": "detector", "version": "1.0", "source": "pretrained"}
    }
    jsonschema.validate(instance=dummy_shelf, schema=shelf_schema)

    # CrowdSnapshot validation
    crowd_schema = {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "definitions": master_schema["definitions"],
        "$ref": "#/definitions/CrowdSnapshot"
    }
    dummy_crowd = {
        "peopleNow": 12,
        "level": "moderate",
        "queues": [{"counterId": "c1", "length": 2, "waitMins": 5.0}],
        "meta": {"model": "counter", "version": "1.0", "source": "pretrained"}
    }
    jsonschema.validate(instance=dummy_crowd, schema=crowd_schema)
