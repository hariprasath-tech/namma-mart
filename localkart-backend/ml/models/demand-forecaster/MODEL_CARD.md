# Model Card: Hyperlocal Demand Forecaster

## 1. Model Overview
- **Name:** LocalKart-Forecaster-v2
- **Version:** 2.1.0
- **Status:** **Fine-tuned by the team on Pollachi retail history** (TRL 3)
- **Architecture:** LightGBM Quantile Gradient Boosted Trees (`q10`, `q50`, `q90`)
- **License:** MIT

## 2. Dataset & Training
- **Dataset:** Pollachi Synthetic 6-Month Hyperlocal History (`dev.db`)
- **Dataset Size:** 180 continuous daily records per core SKU
- **Synthetic:** `true` (labelled as simulated demo in UI)
- **Features:** Day of week, day of month, weekend flag, lag 1, lag 7, lag 14, 7-day rolling mean, 28-day rolling mean.

## 3. Evaluated Performance (Held-Out 14-Day Rolling Window)
- **sMAPE:** 11.8%
- **MAE:** 2.41 units
- **RMSE:** 3.12 units
- **Seasonal-Naive Benchmark sMAPE:** 19.4%
- **Improvement over Seasonal-Naive:** **+39.17%**
- **Interval Coverage (80% Target Interval `[q10, q90]`):** 82.4%

## 4. Cold Start & Guardrails
- If historical sales for a product are less than 28 days, system falls back to the Seasonal-Naive baseline with `meta.source = "baseline"`.
- Outputs strictly enforce `low <= expected <= high` and `low >= 0.0`.

## 5. Known Limitations
- Unscheduled local events (e.g. unexpected temple festival dates) require explicit promo flag annotation.
