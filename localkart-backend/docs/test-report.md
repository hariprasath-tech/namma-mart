# LocalKart v3 – Automated Test & Evaluation Report

**Generated:** 2026-10-30T17:40:00Z  
**Project Maturity:** **TRL 3** (Analytical and experimental critical function proof of concept)  
**Deliverable Mapping:** Formatted for Tables 7.1 and 7.2 in Design Thinking Report (Chapters 6, 7 & 9)

---

## 1. Test Suite Summary Table (Table 7.1)

| Suite Name | Framework | Target / Area | Tests Run | Passed | Failed | Skipped | Status |
|---|---|---|---|---|---|---|---|
| **Frontend Core Tests** | Vitest | State management, simple mode, simulation math | 15 | 15 | 0 | 0 | **PASS** |
| **API Unit Tests** | Vitest | Pure business logic (`api/src/lib/business.ts`) | 16 | 16 | 0 | 0 | **PASS** |
| **API Integration Tests** | Vitest + Supertest | Auth, Search, Concurrency, Idempotency, Holds, CSV Import, Khata Ageing, Multi-Vendor, Reviews, Admin | 23 | 23 | 0 | 0 | **PASS** |
| **Contract Tests** | Vitest + JSON Schema | Fastify endpoints vs `shared/ml.schema.json` | 5 | 5 | 0 | 0 | **PASS** |
| **ML Geometry & Tracking** | Pytest | Gap finder, Shapely zones, Little's Law queues | 6 | 6 | 0 | 0 | **PASS** |
| **Cross-Language Parity** | Pytest vs Vitest | `classifyCrowd` threshold equivalence | 8 | 8 | 0 | 0 | **PASS** |
| **ML Forecaster Invariants** | Pytest | Low <= Exp <= High, non-negativity, cold start | 2 | 2 | 0 | 0 | **PASS** |
| **ML Association Mining** | Pytest | FP-growth basket lift & confidence | 1 | 1 | 0 | 0 | **PASS** |
| **Lost Demand Normalization** | Pytest | Tamil/English transliteration & alias grouping | 5 | 5 | 0 | 0 | **PASS** |
| **Privacy & Zero Disk Leakage** | Pytest | RAM decode & ephemeral frame disposal | 1 | 1 | 0 | 0 | **PASS** |
| **ML Contract Validation** | Pytest + JSON Schema | FastAPI responses vs `shared/ml.schema.json` | 1 | 1 | 0 | 0 | **PASS** |
| **TOTAL** | — | **Full System Regression Suite** | **83** | **83** | **0** | **0** | **100% PASS** |

---

## 2. Test Execution Details

### 2.1 Concurrency & Last-Unit Race Condition Test
- **Test:** `POST /api/v1/orders` concurrency race condition
- **Scenario:** 2 parallel requests submitted simultaneously for an offer having exactly 1 unit of stock.
- **Assertion:** Atomic row-level transaction (`SELECT ... FOR UPDATE`).
- **Result:**
  - Request 1: `HTTP 201 Created` (Order confirmed, stock decremented to 0)
  - Request 2: `HTTP 409 Conflict` (Error Code: `OUT_OF_STOCK`, Message: *"Only 0 units available"*, Fix: *"Pick a quantity of 1 or more from another nearby shop"*)
  - Final Database Stock: Exactly `0`.
- **Verdict:** **PASSED** (Duration: 104 ms)

### 2.2 Idempotency Key Verification Test
- **Test:** `POST /api/v1/orders` duplicate submission
- **Scenario:** Duplicate order request with identical `idempotency-key` header.
- **Result:** Returns previously created order with `HTTP 200 OK` and `isDuplicate: true`. Does not double-decrement inventory.
- **Verdict:** **PASSED**

### 2.3 Cross-Language Parity Test
- **Scenario:** `classifyCrowd` evaluated on 8 benchmark points across TypeScript (`api/src/lib/business.ts`) and Python (`ml/app/services/person_counter.py`).
- **Result:** 100% identical category assignments (`quiet`, `moderate`, `busy`) across all boundary cases (e.g. 10/30 -> quiet, 11/30 -> moderate, 23/30 -> busy).
- **Verdict:** **PASSED**

---

## 3. Machine Learning Metrics & Benchmarks (Table 7.2)

Extracted automatically from `ml/reports/metrics.json`:

| Model Identifier | Architecture | Source Label | Held-Out Dataset | Primary Metric | Baseline Metric | Measured Improvement |
|---|---|---|---|---|---|---|
| `shelf-detector` | YOLO Dense Retail | Pretrained | SKU-110K (11,762 imgs) | **mAP@0.5: 0.842** | — | — |
| `gap-finder` | Polygon Intersection | Built by team | 150 Shelf Slots | **Accuracy: 100%** | Empty Baseline: 0% | Complete planogram recovery |
| `person-counter` | COCO + Centroid Tracker | Pretrained | COCO Val & Store Video | **MAE: 1.14 persons** | Naive Avg: 4.8 | -76.2% error |
| `demand-forecaster` | LightGBM Quantile | Fine-tuned by team | 180-Day History (`dev.db`) | **sMAPE: 11.8%** | Seasonal-Naive: 19.4% | **+39.17% over baseline** |
| `product-associator` | FP-Growth (`mlxtend`) | Trained by team | 80 Multi-Item Bills | **Hit-Rate@3: 78.4%** | Random Pair: 12.5% | Lift up to 1.85x |

---

## 4. Code Coverage Analysis

- **Core API (`api/src/lib` & `api/src/modules`):** **88.4%** branch coverage
- **ML Services (`ml/app/services`):** **91.2%** statement coverage
- **Contract Schema Adherence (`shared/ml.schema.json`):** **100%** schema validation pass across both Node and Python runtimes.
