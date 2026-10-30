"""
Smart Shelf Analysis Router.
POST /ml/v1/shelf/analyze
"""

import json
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from app.schemas import ShelfStatus
from app.services.shelf_detector import analyze_shelf_frame

router = APIRouter(prefix="/shelf", tags=["Shelf"])


@router.post("/analyze", response_model=ShelfStatus)
async def analyze_shelf(
    shopId: str = Form(...),
    cameraId: str = Form(...),
    image: UploadFile = File(...),
    planogram: Optional[str] = Form(None)
):
    """
    Analyzes an in-memory shelf frame image.
    Validates MIME type, decodes in RAM, runs gap finder, and discards image immediately.
    """
    if not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image uploads are permitted.")

    content = await image.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image exceeds 5MB size limit.")

    planogram_list = None
    if planogram:
        try:
            planogram_list = json.loads(planogram)
        except Exception:
            pass

    status, frame_hash = analyze_shelf_frame(content, cameraId, planogram_list)
    return status
