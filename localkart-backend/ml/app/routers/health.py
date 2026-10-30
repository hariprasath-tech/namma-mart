"""
Health and Model Registry Router.
GET /ml/v1/health, GET /ml/v1/models
Strictly declaring TRL 3 maturity level.
"""

from datetime import datetime, timezone
from fastapi import APIRouter

router = APIRouter(tags=["Health & Models"])


@router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "localkart-ml",
        "trlLevel": 3,
        "trlStatus": "estimated TRL 3 - Analytical and experimental critical function and/or characteristic proof of concept",
        "gpuAvailable": False,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@router.get("/models")
async def list_models():
    """
    Returns registered ML models with their source labels and versions.
    Every model card corresponds to this manifest.
    """
    return {
        "models": [
            {
                "name": "shelf-detector",
                "version": "3.0.0",
                "source": "pretrained",
                "label": "Pretrained, not trained by the team",
                "framework": "YOLO / Dense Feature Geometry",
                "license": "AGPL-3.0 / MIT alternative documented",
                "task": "Object bounding box and facing coverage analysis"
            },
            {
                "name": "gap-finder",
                "version": "1.0.0",
                "source": "fine-tuned",
                "label": "Built by the team",
                "framework": "Computational Geometry (Polygon Intersection)",
                "license": "Proprietary LocalKart",
                "task": "Planogram facing discrepancy detection"
            },
            {
                "name": "person-counter",
                "version": "1.2.0",
                "source": "pretrained",
                "label": "Pretrained, not trained by the team",
                "framework": "COCO person class detector + Centroid Tracker",
                "license": "Apache-2.0",
                "task": "Crowd density & line crossing estimation"
            },
            {
                "name": "demand-forecaster",
                "version": "2.1.0",
                "source": "fine-tuned",
                "label": "Trained by the team on Pollachi retail history",
                "framework": "LightGBM Quantile Regression (q10, q50, q90)",
                "license": "MIT",
                "task": "Multi-day demand interval forecasting"
            },
            {
                "name": "product-associator",
                "version": "1.1.0",
                "source": "fine-tuned",
                "label": "Trained by the team on bill transactions",
                "framework": "FP-Growth (mlxtend)",
                "license": "BSD-3-Clause",
                "task": "Frequently bought together mining"
            }
        ]
    }
