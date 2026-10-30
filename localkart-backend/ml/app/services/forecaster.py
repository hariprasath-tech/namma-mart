"""
Demand Forecasting Service.
Implements Seasonal-Naive Benchmark Baseline and LightGBM Quantile Regression (q10, q50, q90).
Strictly enforces low <= expected <= high and non-negativity.
"""

from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any, Tuple
import numpy as np
import pandas as pd
import lightgbm as lgb
from app.schemas import ForecastPoint


def seasonal_naive_forecast(history_series: pd.Series, horizon_days: int = 7) -> List[ForecastPoint]:
    """
    Seasonal-Naive Baseline:
    Predicts each future day as the value from the exact same day-of-week 7 days prior.
    """
    last_date = history_series.index.max() if isinstance(history_series.index, pd.DatetimeIndex) else datetime.now(timezone.utc)
    points: List[ForecastPoint] = []
    
    values = history_series.values
    n = len(values)

    for i in range(1, horizon_days + 1):
        target_date = last_date + timedelta(days=i)
        # Take same weekday from 7 days ago if available, else 14, else mean
        lag_idx = n - 7 + ((i - 1) % 7)
        if 0 <= lag_idx < n:
            val = float(values[lag_idx])
        else:
            val = float(np.mean(values[-7:]) if n >= 7 else np.mean(values))

        expected = max(0.0, round(val, 1))
        spread = max(1.0, round(expected * 0.2, 1))
        low = max(0.0, round(expected - spread, 1))
        high = max(expected, round(expected + spread, 1))

        points.append(
            ForecastPoint(
                date=target_date.strftime("%Y-%m-%d"),
                expected=expected,
                low=low,
                high=high
            )
        )

    return points


def extract_features(df: pd.DataFrame) -> pd.DataFrame:
    """Creates lag and calendar features for sales forecasting."""
    feat = df.copy()
    feat["weekday"] = feat["date"].dt.day_of_week
    feat["day"] = feat["date"].dt.day
    feat["is_weekend"] = feat["weekday"].isin([5, 6]).astype(int)

    # Lags
    feat["lag_1"] = feat["sales"].shift(1)
    feat["lag_7"] = feat["sales"].shift(7)
    feat["lag_14"] = feat["sales"].shift(14)

    # Rolling statistics
    feat["rolling_mean_7"] = feat["sales"].shift(1).rolling(7, min_periods=1).mean()
    feat["rolling_mean_28"] = feat["sales"].shift(1).rolling(28, min_periods=1).mean()

    return feat


def generate_demand_forecast(
    sales_records: List[Dict[str, Any]],
    horizon_days: int = 7
) -> Tuple[List[ForecastPoint], str]:
    """
    Generates a forecast for the next horizon_days.
    Returns: (forecast_points, source_label)
    If history < 28 days -> returns baseline with source="baseline".
    If history >= 28 days -> fits LightGBM quantile regression (q10, q50, q90).
    """
    if len(sales_records) < 28:
        # Cold start fallback
        if not sales_records:
            # Synthetic 14-day minimal seed
            today = datetime.now(timezone.utc)
            dummy_dates = [today - timedelta(days=d) for d in range(14, 0, -1)]
            dummy_sales = [12.0 + (d % 5) for d in range(14)]
            df = pd.DataFrame({"date": dummy_dates, "sales": dummy_sales})
        else:
            df = pd.DataFrame(sales_records)
            df["date"] = pd.to_datetime(df["date"])
            df["sales"] = df["sales"].astype(float)
        
        df = df.sort_values("date").set_index("date")
        return seasonal_naive_forecast(df["sales"], horizon_days), "baseline"

    # Train LightGBM Quantile Models
    df = pd.DataFrame(sales_records)
    df["date"] = pd.to_datetime(df["date"])
    df["sales"] = df["sales"].astype(float)
    df = df.sort_values("date").reset_index(drop=True)

    feat_df = extract_features(df).dropna()
    feature_cols = ["weekday", "day", "is_weekend", "lag_1", "lag_7", "lag_14", "rolling_mean_7", "rolling_mean_28"]
    
    X = feat_df[feature_cols]
    y = feat_df["sales"]

    # Quantile models: 10%, 50%, 90%
    q_models = {}
    for alpha in [0.10, 0.50, 0.90]:
        model = lgb.LGBMRegressor(
            objective="quantile",
            alpha=alpha,
            n_estimators=40,
            learning_rate=0.08,
            random_state=42,
            verbose=-1
        )
        model.fit(X, y)
        q_models[alpha] = model

    # Iterative multi-step prediction
    last_row = df.iloc[-1]
    last_date = last_row["date"]
    current_history = list(df["sales"].values)

    points: List[ForecastPoint] = []
    
    for step in range(1, horizon_days + 1):
        target_date = last_date + timedelta(days=step)
        weekday = target_date.weekday()
        day = target_date.day
        is_weekend = 1 if weekday in [5, 6] else 0

        lag_1 = current_history[-1]
        lag_7 = current_history[-7] if len(current_history) >= 7 else current_history[-1]
        lag_14 = current_history[-14] if len(current_history) >= 14 else lag_7
        rolling_7 = np.mean(current_history[-7:])
        rolling_28 = np.mean(current_history[-28:])

        step_features = pd.DataFrame([{
            "weekday": weekday,
            "day": day,
            "is_weekend": is_weekend,
            "lag_1": lag_1,
            "lag_7": lag_7,
            "lag_14": lag_14,
            "rolling_mean_7": rolling_7,
            "rolling_mean_28": rolling_28
        }])

        pred_q10 = float(q_models[0.10].predict(step_features)[0])
        pred_q50 = float(q_models[0.50].predict(step_features)[0])
        pred_q90 = float(q_models[0.90].predict(step_features)[0])

        # Enforce non-negativity and low <= expected <= high
        expected = max(0.0, round(pred_q50, 1))
        low = max(0.0, round(min(pred_q10, expected), 1))
        high = max(expected, round(max(pred_q90, expected), 1))

        current_history.append(expected)

        points.append(
            ForecastPoint(
                date=target_date.strftime("%Y-%m-%d"),
                expected=expected,
                low=low,
                high=high
            )
        )

    return points, "fine-tuned"
