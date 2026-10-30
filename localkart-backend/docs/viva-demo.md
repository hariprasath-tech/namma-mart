# LocalKart v3 – 3-Minute Viva Demonstration Script

**Maturity Level:** **TRL 3** (Analytical and experimental critical function proof of concept)  
**Target Duration:** Exactly 3 minutes (180 seconds)  
**Presenter Setup:** Single laptop running frontend (`localhost:5173`), API (`localhost:4000`), and ML service (`localhost:8000`).

---

## ⏱️ Timeline & Step-by-Step Flow

### 0:00 – 0:30 | System Architecture & Honesty Statement
1. **Open Swagger Documentation:** Navigate browser to `http://localhost:4000/api/docs`.
2. **Show Health & Model Registry:**
   - Execute `GET /api/v1/health`: Highlight `"trlLevel": 3` and `"trlStatus": "estimated TRL 3"`.
   - Execute `GET /ml/v1/models`: Show explicit model source tags (`pretrained` vs `fine-tuned` vs `baseline`).
3. **Say:**  
   > *"LocalKart v3 is operating strictly at TRL 3. All models are either pretrained or trained by the team, every synthetic data point is labelled, and zero metrics are invented."*

---

### 0:30 – 1:00 | Multi-Shop Compare & Live Search
1. **Search 'Rice' in App:** Open `http://localhost:5173/search?q=rice`.
2. **Point out Multi-Shop Comparison:**
   - Note the ranked store offers: Cheaper (Niligiris ₹52 vs Sri Krishna ₹55), Closer (0.8 km vs 1.2 km).
3. **Show Terminal Verification:**
   ```bash
   curl -s "http://localhost:4000/api/v1/search?q=rice" | jq .products[0].offers
   ```
4. **Say:**  
   > *"The ranking uses our unit-tested Haversine and comparison algorithms in pure TypeScript, delivering stable, deterministic price and distance sorting."*

---

### 1:00 – 1:30 | Concurrency & Last-Unit Race Condition
1. **Show Concurrency Test Code:** Open `api/tests/integration/api.test.ts` lines 78–125.
2. **Run the Test Live:**
   ```bash
   cd localkart-backend/api && npm run test -- -t "atomic row lock"
   ```
3. **Demonstrate Result:**
   - Explain how two simultaneous order requests for the last remaining unit execute with atomic DB row-level transactions (`SELECT ... FOR UPDATE`).
   - Exactly **1 order succeeds (HTTP 201)** and **1 request fails (HTTP 409)** with a human-actionable fix sentence (`"error.fix": "Pick a quantity of 1 or more from another nearby shop"`).
4. **Say:**  
   > *"Our inventory integrity is protected against double-spending and overselling under concurrent loads."*

---

### 1:30 – 2:15 | Smart Shelf, Privacy & Demand Forecasting
1. **Owner Smart Shelf Tab:**
   - Open Owner Dashboard (`http://localhost:5173/shop/shop_sp_organic?tab=shelf`).
   - Trigger camera analysis: detected boxes render on screen and a shelf gap appears (`Slot A1 - Ponni Rice: 2 facings missing`).
   - Tap **"Create Reorder"** to generate a stock replenishment order in 1 click.
2. **Explain Privacy Guarantee:**
   - Show `docs/privacy.md`: Image decoded in volatile RAM, SHA-256 hash saved, zero raw video/images written to disk.
3. **Execute ML CLI Pipeline (`make ml-run`):**
   ```bash
   cd localkart-backend/ml && .venv/Scripts/python -m app.cli run-demo
   ```
   - Show real LightGBM quantile forecast (`q10`, `q50`, `q90`) enforcing non-negativity and bounds.
   - Show FP-Growth frequently bought together pairs (e.g. *Tea Dust + Aavin Milk, Lift 2.67x*).

---

### 2:15 – 3:00 | Metrics, Test Report & Conclusion
1. **Inspect `ml/reports/metrics.json`:**
   - Show the evaluated **sMAPE of 11.8%** vs the **Seasonal-Naive baseline of 19.4%** (**+39.17% improvement**).
2. **Open `docs/test-report.md`:**
   - Point to **53 / 53 automated tests passing** across API unit, integration, contract, and ML suites.
3. **Conclude:**
   > *"In conclusion, LocalKart v3 bridges customer convenience and shopkeeper survival through mathematically grounded ML and robust transactional backend architecture—fully validated at TRL 3 on a single machine."*
