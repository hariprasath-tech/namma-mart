# LocalKart v3 – Core API Reference & OpenAPI Inventory

**Base Path:** `/api/v1`  
**API Specification:** OpenAPI 3.0 / Fastify Swagger (`/api/docs`)  
**Error Standard:** Unified shape `{ error: { code, message, fix } }`  
**Maturity Level:** **TRL 3** (Analytical and experimental critical function proof of concept)

---

## 1. Error Response Contract

All client and server errors return an identical, human-actionable schema:

```json
{
  "error": {
    "code": "OUT_OF_STOCK",
    "message": "Only 0 units of 'Ponni Rice 5kg' are currently available.",
    "fix": "Pick a quantity of 1 or more from another nearby shop."
  }
}
```

---

## 2. Authentication & Authorization (`/auth`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/auth/register` | Public | Register customer account with name, phone, password |
| `POST` | `/auth/login` | Public | Authenticate via phone and bcrypt password |
| `POST` | `/auth/otp/request` | Public | Request dev SMS OTP (returns `mock: true` in development) |
| `POST` | `/auth/otp/verify` | Public | Verify OTP (`123456` in dev) and receive JWT |
| `POST` | `/auth/refresh` | Public | Refresh expired JWT access token |
| `GET` | `/auth/me` | Authenticated | Inspect current user token and role |

---

## 3. Shops & Local Catalogue (`/shops`, `/products`, `/search`)

| Method | Endpoint | Query / Body | Description |
|---|---|---|---|
| `GET` | `/shops` | `?area=&type=` | List verified Pollachi grocery stores & department marts |
| `GET` | `/shops/:id` | None | Get shop details, categories, active offers, recent reviews |
| `GET` | `/shops/:id/reviews` | None | Fetch customer ratings and reviews |
| `GET` | `/shops/:id/crowd` | None | Proxies ML crowd intelligence (`peopleNow`, `level`, `queues`) |
| `GET` | `/products` | `?category=&q=` | Browse master product catalogue |
| `GET` | `/products/:id` | None | Detailed SKU view with offers across all local shops |
| `GET` | `/search` | `?q=&area=&lat=&lng=` | Hyperlocal search; logs zero-stock queries to `SearchLog` |

---

## 4. Multi-Shop Comparison & Basket Optimization (`/compare`, `/basket`)

### Compare Offers: `GET /api/v1/compare/:productId?lat=10.6609&lng=77.0048`
Returns offers ranked across nearby stores with explicit plain-words tags:
- `cheapest`: lowest price in paise
- `closest`: nearest store in metres via Haversine
- `topRated`: highest store customer rating

### Basket Optimization: `POST /api/v1/basket/optimize`
Body:
```json
{
  "list": [
    { "productId": "p-ponni-rice", "qty": 1 },
    { "productId": "p-coconut-oil", "qty": 1 }
  ],
  "lat": 10.6609,
  "lng": 77.0048
}
```
Returns:
- `bestSingle`: Best price and delivery if purchasing everything from one shop.
- `bestSplit`: Best price if splitting across at most 2 shops, factoring delivery fee and extra-pickup penalty.
- `explanation`: Plain-words recommendation (e.g. *"Splitting saves ₹35 after delivery fee"*).

---

## 5. Orders, Payments & Concurrency (`/orders`, `/payments`, `/holds`)

### Order Placement: `POST /api/v1/orders`
Headers: `idempotency-key: <unique-uuid>`  
Executes in an atomic database transaction with row-level stock check.
```bash
curl -X POST http://localhost:4000/api/v1/orders \
  -H "Content-Type: application/json" \
  -H "idempotency-key: order-req-001" \
  -d '{
    "shopId": "shop_sp_organic",
    "customerName": "Ravi Kumar",
    "customerPhone": "+91 98421 11111",
    "items": [{ "offerId": "off-001", "qty": 1 }]
  }'
```

### Mock Payment Confirmation: `POST /api/v1/payments/confirm?outcome=success`
Deterministic outcome switch (`outcome=success|fail`) for viva demonstrations.
- Success: marks order `paid`, keeps decremented stock.
- Fail: marks order `failed`, increments stock back, records compensatory `StockMovement`.

### 30-Minute Hold Reservation: `POST /api/v1/holds`
Reserves store stock for 30 minutes while customer walks to shop. If expired or cancelled (`DELETE /holds/:id`), stock is automatically returned.

---

## 6. Shop Owner Operations (`/owner`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/owner/stock` | View active inventory with confidence score (`fresh` < 24h, `stale` > 24h) |
| `POST` | `/owner/stock/:id/adjust` | Record physical stock audit (writes append-only `StockMovement`) |
| `GET` | `/owner/pnl` | Calculate revenue, COGS, gross margin, expenses, and net profit |
| `POST` | `/owner/day-close` | Daily cash drawer closing with discrepancy status (`matched`, `short`, `over`) |
| `GET` | `/owner/khata` | Credit ledger customer balances and ageing buckets (0–7d, 8–30d, 30+d) |
| `GET` | `/owner/insights/lost-demand` | Ranked unmet customer demand from zero-stock searches and item requests |
| `GET` | `/owner/insights/forecast/:id` | 7-day quantile demand interval (`low <= expected <= high`) |
| `GET` | `/owner/insights/bundles` | Frequently bought together pairs mined via FP-Growth |
| `GET` | `/owner/shelf/status` | Edge camera gap detection returning missing facings and reorder recommendations |
