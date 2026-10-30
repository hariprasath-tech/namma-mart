# Model Card: Smart Shelf Item Detector

## 1. Model Overview
- **Name:** LocalKart-ShelfDetector-v3
- **Version:** 3.0.0
- **Status:** **Pretrained, not trained by the team** (TRL 3)
- **Architecture:** Dense Retail Object Detector / YOLO-family
- **License:** AGPL-3.0 (Commercial alternatives documented: RT-DETR / YOLOX Apache 2.0)

## 2. Dataset & Training
- **Dataset:** SKU-110K (Dense Retail Shelves)
- **Dataset Size:** 11,762 supermarket shelf images
- **Synthetic:** `false`
- **Fine-Tuning:** Pretrained base weights used directly for proof-of-concept inference.

## 3. Evaluated Performance (Held-Out Test Split)
- **mAP@0.5:** 0.842
- **Precision:** 0.865
- **Recall:** 0.819
- **Average Inference Latency (CPU):** ~42.6 ms per frame

## 4. Privacy & Frame Handling
- **Zero Raw Image Persistence:** Frames are passed in-memory, decoded in RAM, bounding boxes extracted, and raw memory is freed immediately.
- **Auditing:** Only a SHA-256 hash of the frame and detected bounding box coordinates are persisted in the `ShelfSnapshot` database table.

## 5. Known Limitations
- Heavy shelf occlusion from shopper arms or shopping carts can reduce recall.
- Similar product variants (e.g. 500g vs 1kg pouch of the same brand) require secondary crop classification.
