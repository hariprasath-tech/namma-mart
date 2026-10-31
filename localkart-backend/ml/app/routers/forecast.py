"""
Demand Forecast Router.
GET /ml/v1/forecast/{shopId}/{productId}?days=7
"""

import sqlite3
import os
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Query
from app.schemas import ForecastPoint
from app.services.forecaster import generate_demand_forecast

router = APIRouter(prefix="/forecast", tags=["Forecast"])


@router.get("/{shopId}/{productId}", response_model=List[ForecastPoint])
async def get_product_forecast(
    shopId: str,
    productId: str,
    days: int = Query(7, ge=1, le=30)
):
    """
    Returns next N days of predicted demand with 80% prediction intervals (q10 to q90).
    Enforces low <= expected <= high and low >= 0.
    """
    sales_history = []
    
    # Check SQLite database seeded by Core API if present
    db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../api/prisma/dev.db"))
    if os.path.exists(db_path):
        try:
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT strftime('%Y-%m-%d', at) as day, ABS(SUM(qty))
                FROM StockMovement
                WHERE shopId = ? AND type = 'sale'
                GROUP BY day
                ORDER BY day ASC
                """,
                (shopId,)
            )
            rows = cursor.fetchall()
            for r in rows:
                sales_history.append({"date": r[0], "sales": float(r[1])})
            conn.close()
        except Exception:
            pass

    points, source = generate_demand_forecast(sales_history, horizon_days=days)
    return points
