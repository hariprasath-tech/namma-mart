# LocalKart v3 – Backend & ML System Architecture

> **Document Classification:** TRL 3 System Architecture Specification  
> **Target Environment:** Pollachi Hyperlocal Commerce Network  
> **Academic Integrity:** All metrics and telemetry derived from deterministic evaluation pipelines or honest baseline comparisons. Zero invented figures.

---

## 1. System Overview

LocalKart v3 connects the existing reactive frontend (`namma-mart`) with a full-stack backend comprising:
1. **Core API Gateway (`api/`):** Fastify + TypeScript application managing database transactions, authentication, order lifecycle, stock management, and proxying ML queries.
2. **Machine Learning Microservice (`ml/`):** FastAPI + Python 3.11 service executing edge-style computer vision (shelf gap analysis, crowd person tracking), demand forecasting (LightGBM quantile regression), and association rule mining.
3. **Database Layer:** PostgreSQL 16 (production/Docker) and SQLite (zero-config local test runtime) managed via Prisma ORM.
4. **Cache & Worker:** Redis + BullMQ managing hold expirations (30-minute auto-release) and price-watch notifications.

```
+-------------------------------------------------------------------------+
|                        LocalKart Frontend (React 19)                    |
|                VITE_API_URL: http://localhost:4000/api/v1               |
|                VITE_ML_MODE: http | mock                                |
+-------------------------------------------------------------------------+
                                    │
                         REST / JSON / Multipart
                                    ▼
+-------------------------------------------------------------------------+
|                      Fastify Core API Gateway (:4000)                   |
|  - Auth & RBAC (JWT: Customer, Owner, Staff, Admin)                     |
|  - Store & Product Catalogue                                            |
|  - Transactional Orders & Stock Movements (Append-Only)                 |
|  - Pure Business Lib: Haversine, Compare, Smart Basket, P&L             |
|  - Circuit Breaker & Stale-Cache ML Proxy (/ml-proxy)                   |
+-------------------------------------------------------------------------+
         │                                       │
    Prisma ORM                              HTTP / JSON
         ▼                                       ▼
+--------------------------+       +--------------------------------------+
|  PostgreSQL / SQLite DB  |       |       FastAPI ML Microservice (:8000)|
|  - 28 Relational Models  |       |  - Shelf Detector & Gap Finder       |
|  - Integer Paise Money   |       |  - Pretrained Person Counter & Zones |
|  - Stock Movements Log   |       |  - LightGBM Demand Forecaster        |
|  - ModelRun & SearchLog  |       |  - FP-Growth Product Associator      |
+--------------------------+       +--------------------------------------+
         ▲                                       │
         │                                  In-Memory Only
    Redis / BullMQ                               │
    - 30-min Hold Expiry            (Raw frames discarded immediately;
    - Price Watch Alerts             no faces or video stored on disk)
```

---

## 2. Order Placement & Concurrency Data Flow

To prevent overselling and race conditions when multiple customers buy the last available inventory item simultaneously, order placement executes inside an atomic database transaction with strict row-level locking:

```
Customer A (Checkout)                     Customer B (Checkout)
        │                                         │
        ▼                                         ▼
   POST /orders                              POST /orders
(Idempotency: key_1)                      (Idempotency: key_2)
        │                                         │
        ├───────────────────┬─────────────────────┤
                            │
               [ BEGIN TRANSACTION: SERIALIZABLE ]
                            │
              SELECT * FROM "Offer" WHERE id = $id
                      FOR UPDATE (Row Lock)
                            │
              Customer A locks row first:
              - Checks: stock (1) >= requested (1) -> TRUE
              - UPDATE "Offer" SET stock = stock - 1 (Now 0)
              - INSERT "StockMovement" (type: 'sale', qty: -1)
              - INSERT "Order" (status: 'packed')
              - INSERT "Payment" (status: 'pending')
              - COMMIT TRANSACTION
                            │
              Customer B row lock acquired:
              - Checks: stock (0) >= requested (1) -> FALSE!
              - ROLLBACK TRANSACTION
              - Return 409 Conflict:
                {
                  "error": {
                    "code": "OUT_OF_STOCK",
                    "message": "Item was just purchased by another shopper",
                    "fix": "Check alternative nearby shops on the comparison map"
                  }
                }
                            │
        ▼                                         ▼
  Order #LK-9214                           Error 409 Displayed
  (Stock Decremented)                      (Zero Stock Inconsistency)
```

---

## 3. Smart Shelf CCTV Analysis Data Flow (Privacy-First)

In accordance with strict ethical rules for TRL 3 viva evaluation, **no facial recognition is performed, and no customer or shelf camera frames are ever written to disk**:

```
[ Camera Frame / Edge Upload ] (POST /owner/cameras/:id/frame)
               │
               ▼ (Multipart memory stream)
     [ Fastify API Gateway ]
               │ (Stream piped directly to ML microservice)
               ▼
     [ FastAPI ML Service ] (POST /ml/v1/shelf/analyze)
               │
               ├── 1. Memory decode via OpenCV (cv2.imdecode from buffer)
               ├── 2. Hash frame bytes: frame_hash = sha256(buffer)
               ├── 3. Execute Object Detection (YOLO / Dense Retail Detector)
               │      Returns: Bounding boxes [x, y, w, h] + confidence
               ├── 4. Pass bounding boxes to Gap Finder (Planogram Geometry)
               │      Compute slot intersection: IOU / coverage < threshold
               ├── 5. Discard raw pixel buffer from RAM immediately
               │
               ▼
     Returns ShelfStatus JSON:
     {
       "cameraId": "cam-1",
       "capturedAt": "2026-10-30T17:00:00Z",
       "boxes": [{ "label": "Rice 1kg", "qty": 8, "confidence": 0.94, "bbox": [10, 20, 30, 40] }],
       "gaps": [{ "slot": "Rack-A2", "productId": "prod-1", "missing": 2 }],
       "meta": { "model": "yolov8n-retail", "version": "1.0", "source": "fine-tuned" }
     }
               │
               ▼
     [ Fastify DB Store ]
     - Saves ShelfSnapshot row (frame_hash, detected boxes JSON, gap count)
     - NO image file is saved in uploads/ or PostgreSQL.
```

---

## 4. Real vs Mocked Delineation (TRL 3 Honesty Matrix)

| Subsystem | Real Implementation | Mocked / Simulated Boundary |
|---|---|---|
| **Core API** | Real Fastify HTTP server, Zod schemas, JWT authentication, RBAC authorization, and input sanitization. | Fixed dev OTP (`123456`) in `NODE_ENV=development`. |
| **Database** | Real Prisma relational schema with append-only stock audit logs and transactional row locks. | Seed data uses synthetic 6-month sales histories labelled `synthetic: true`. |
| **Pure Logic** | 100% mathematical parity: Haversine distance, single vs split basket optimization, P&L formulas, day-close cash diff, and crowd classifiers. | None. Exactly matches frontend calculation functions. |
| **Shelf Vision** | Real geometry planogram gap detection (`gap_finder.py`) + YOLO inference on sample images. | Real video streaming servers (RTSP camera hardware) replaced by uploaded test frames. |
| **Crowd & Queues** | Real person detection via pretrained COCO weights, centroid zone assignment via `shapely`, and Little's Law queue math. | Real store CCTV feeds replaced with sample store video (`ml/samples/store.mp4`). |
| **Demand Forecast** | Real LightGBM quantile regression (q10, q50, q90) producing verified `low <= expected <= high` bands beating seasonal-naive baselines. | Evaluated on public retail datasets + synthetic shop sales history. |
| **Product Bundles** | Real FP-Growth frequent itemset mining via `mlxtend` calculating support, confidence, and lift. | Run over transaction bills generated by the seed pipeline. |
| **Payments** | Real transaction state machine and idempotency checks. | Real banking networks / UPI gateways mocked via `?outcome=success\|fail`. |
| **Logistics** | Real neighbourhood group delivery fee scaling formula. | Real delivery rider GPS fleet mocked. |

---

## 5. Technology Readiness Level Declaration

- **Current Status:** **TRL 3 (Experimental Proof of Concept)**
- The system demonstrates integrated analytical and algorithmic feasibility. It is prepared for academic viva examination with reproducible scripts (`make ml-eval`, `make test`, `make ml-run`).
- Claims of TRL 4+ or live production deployments with commercial partner stores are strictly avoided.
