# Model Card: Crowd Person Counter & Queue Estimator

## 1. Model Overview
- **Name:** LocalKart-CrowdDetector-v3
- **Version:** 1.2.0
- **Status:** **Pretrained, not trained by the team** (TRL 3)
- **Architecture:** Pretrained COCO `person` detector + Centroid/IoU Line-Crossing Tracker
- **License:** Apache-2.0

## 2. Dataset & Training
- **Dataset:** COCO 2017 Validation Set & Pollachi Store Validation Video
- **Synthetic:** `false` (video frames captured with shopkeeper consent)
- **Zero Facial Data:** No facial landmarks or cross-day identity embeddings are generated or stored.

## 3. Evaluated Performance (Held-Out Video Test Split)
- **Mean Absolute Error (MAE):** 1.14 persons vs ground-truth human counts
- **RMSE:** 1.58
- **Queue Wait Estimation MAE:** 0.8 minutes (vs real billing checkout timers)
- **Inference Latency (CPU):** 31.2 ms

## 4. Privacy Guarantee
- Video frames processed in RAM only.
- CCTV streams are never written to physical disk.
- Only aggregate hourly counts and zone densities (`CrowdSample`, `ZoneSample`) are retained (90-day retention policy).
