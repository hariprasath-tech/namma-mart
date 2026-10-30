"""
LocalKart ML Service Application.
FastAPI service exposing /ml/v1 endpoints.
"""

import time
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from app.routers import shelf, crowd, footfall, zones, forecast, associations, lost_demand, health

app = FastAPI(
    title="LocalKart ML Service",
    description="Hyperlocal retail intelligence microservice for Pollachi shops (TRL 3)",
    version="3.0.0",
    docs_url="/ml/docs",
    openapi_url="/ml/openapi.json"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Timing middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Inference-Time-Ms"] = str(round(process_time * 1000, 2))
    return response

# Mount routers under /ml/v1
app.include_router(shelf.router, prefix="/ml/v1")
app.include_router(crowd.router, prefix="/ml/v1")
app.include_router(footfall.router, prefix="/ml/v1")
app.include_router(zones.router, prefix="/ml/v1")
app.include_router(forecast.router, prefix="/ml/v1")
app.include_router(associations.router, prefix="/ml/v1")
app.include_router(lost_demand.router, prefix="/ml/v1")
app.include_router(health.router, prefix="/ml/v1")

# Also alias root health for top-level health probes
@app.get("/health", tags=["Root"])
async def root_health():
    return {"status": "ok", "service": "localkart-ml", "trl": 3}
