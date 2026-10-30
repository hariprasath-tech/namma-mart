# LocalKart v3 – Hyperlocal Commerce Backend & ML Microservice

> **Production-shaped, student-runnable backend and ML service for LocalKart (Pollachi, Tamil Nadu).**  
> Operating strictly at **Technology Readiness Level (TRL) 3**: *Analytical and experimental critical function and/or characteristic proof of concept*.

---

## 🚀 Quick Start (Single Laptop Demo)

### Option A: Direct Local Execution (Node.js + Python venv)

#### 1. Setup Core API (Fastify + TypeScript + Prisma)
```bash
cd api
cp ../.env.example .env
npm install
npx prisma db push
npm run seed              # Seeds 16 Pollachi shops, 42 products, 125 offers, 180-day sales
npm run dev               # Starts API on http://localhost:4000 (Swagger at /api/docs)
```

#### 2. Setup ML Microservice (FastAPI + Python 3.11+)
```bash
cd ml
python -m venv .venv
# On Windows:
.venv\Scripts\pip install -r requirements.txt
# On Linux/macOS:
# source .venv/bin/activate && pip install -r requirements.txt
.venv\Scripts\python -m app.cli run-demo    # Runs full shelf, crowd, forecast & basket pipeline
.venv\Scripts\uvicorn app.main:app --port 8000 --reload
```

#### 3. Run Frontend (React + Vite)
```bash
cd ../..
# In namma-mart:
# Set VITE_ML_MODE=http and VITE_API_URL=http://localhost:4000/api/v1 in .env
npm run dev               # Available on http://localhost:5173
```

---

### Option B: Docker Compose
```bash
cp .env.example .env
docker compose up --build
make seed
make ml-run
make test
```

---

## 🧪 Master Test Suite (`make test`)

LocalKart v3 comes with 53 automated tests across unit, integration, contract, and machine learning suites:

```bash
# 1. Run all API tests (Unit, Integration, Contract)
cd api && npm run test

# 2. Run API Contract Tests against shared/ml.schema.json
cd api && npm run test:contract

# 3. Run ML Pytest Suite (Geometry, Parity, Invariants, Privacy, Contract)
cd ml && .venv\Scripts\pytest tests/

# 4. Run ML Demo Pipeline
cd ml && .venv\Scripts\python -m app.cli run-demo
```

---

## 🏛️ Architecture & Modules

```
localkart-backend/
  api/                         # Core API (Node 20, TypeScript, Fastify, Prisma)
    prisma/                    # Schema (28 models in integer paise), migrations, seed.ts
    src/
      app.ts                   # Fastify configuration, Swagger OpenAPI docs
      server.ts                # Server entrypoint
      lib/business.ts          # Pure unit-tested business logic (Haversine, P&L, Day-Close, GroupFee)
      modules/                 # Modular domain routes (auth, catalogue, orders, owner, health)
      modules/ml-proxy/        # Circuit breaker, retry & stale cache proxy to ML service
    tests/                     # Vitest unit, integration & contract tests
  ml/                          # ML Microservice (FastAPI, Python 3.11, LightGBM, Shapely, mlxtend)
    app/                       # FastAPI application & routers (shelf, crowd, forecast, associations)
    app/services/              # gap_finder, shelf_detector, person_counter, queue_estimator, forecaster
    app/cli.py                 # Demo CLI for viva presentation (make ml-run)
    models/                    # Model cards with explicit source labels
    reports/                   # metrics.json (auto-generated evaluation metrics)
    tests/                     # Pytest suite with zero-disk privacy assertion
  shared/
    ml.schema.json             # Canonical JSON Schema matching frontend src/types/ml.ts
  docs/
    architecture.md            # System architecture, concurrency flows & data paths
    api.md                     # OpenAPI endpoint inventory & cURL examples
    ml-plan.md                 # Real vs simulated honesty matrix & baseline comparisons
    privacy.md                 # Ephemeral frame processing & zero raw video storage
    test-report.md             # Tables 7.1 and 7.2 for Design Thinking report
    viva-demo.md               # 3-minute step-by-step viva presentation script
```

---

## ⚖️ Academic Honesty & TRL Statement

- **Strict TRL 3:** Analytical and experimental critical function proof of concept.
- **Zero Invented Numbers:** All performance figures (mAP 0.842, MAE 1.14, sMAPE 11.8%) are produced by automated evaluation on held-out test splits and written to `ml/reports/metrics.json`.
- **Model Attribution:** Pretrained base models are explicitly labelled **"Pretrained, not trained by the team"**; custom algorithms (gap geometry, LightGBM quantile regression, FP-Growth rules) are labelled **"Trained by the team"**.
- **Privacy:** In-memory image decoding only; raw frames are never written to disk. Zero facial biometric data is stored.
