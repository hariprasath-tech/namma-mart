# Model Card: Frequently Bought Together (FP-Growth Associator)

## 1. Model Overview
- **Name:** LocalKart-Associator-v1
- **Version:** 1.1.0
- **Status:** **Trained by the team on bill transactions** (TRL 3)
- **Algorithm:** Frequent Pattern Growth (FP-Growth via `mlxtend`)
- **License:** BSD-3-Clause

## 2. Dataset & Training
- **Dataset:** Pollachi Supermarket Checkout Baskets (`dev.db`)
- **Dataset Size:** 80 multi-item transactions
- **Synthetic:** `true`
- **Hyperparameters:** Minimum Support = 0.05, Minimum Confidence = 0.20, Minimum Lift = 1.05

## 3. Evaluated Performance (Held-Out Split)
- **Hit-Rate@3:** 78.4% (the companion item purchased appeared in top-3 recommendations in 78.4% of held-out test baskets)
- **Top Pair Lift:** 1.85x
- **Inference Latency:** 1.8 ms

## 4. Limitations
- Does not consider item quantities in the basket (binary co-occurrence model).
