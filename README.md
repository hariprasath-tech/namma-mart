# LocalKart v2 (நம்ம Mart)

**Support Local. Shop Meaningful.**  
*Hyperlocal shopping app and store intelligence platform for Pollachi, Tamil Nadu.*

---

## 🌾 0. Goal of v2

LocalKart v1 solved *"which nearby shop has it, cheapest, closest"*. **LocalKart v2** transforms the system into a complete **Design Thinking Final Capstone Project** solving both sides' pain points:

- **Customer pain points solved:** Wasted shopping trips, unknown stock availability, billing queues and crowd friction, unfair individual delivery fees, age and language barriers, lack of trust in unfamiliar stores.
- **Shop owner pain points solved:** Manual stock tracking, no visibility into where money goes, customer credit (khata) chaos, lost sales from missing items (lost demand), shelf shrinkage/leakage, and billing queues in high-footfall department stores.

> **Academic Rigor & Honesty Rules (TRL 3):**  
> • All computer vision (shelf gap detection, crowd levels, queue waits, demand forecasts) operate through a deterministic seeded simulation layer (`src/ml-sim/mockMLService.ts`) with every related card carrying a **"Simulated demo"** badge.  
> • Project is classified strictly at **Technology Readiness Level 3 (TRL 3)**.  
> • Optional real demo: In-browser client-side person detection using pretrained TensorFlow.js COCO-SSD (`/shop/crowd/demo`), with zero video leaving the browser.

---

## ⚡ 1. The Memorable Moment: Nearby Map Hero (Fixed & Anchored)

Observed and resolved in v2:
1. **Dynamic Price Pins:** Live price tags update reactively as you type (e.g. *₹48 · 0.8 km*).
2. **Anchor Tails:** Pins use `L.divIcon` with content-sized pills (`width: max-content`), a tail pointing to the exact GPS coordinate, and a tip anchor dot.
3. **No Clipped Text:** Slicing removed; human-chosen `shortName` (max 16 chars) used on pills, full name in bottom sheets.
4. **Collision Avoidance:** Automatic label collision pass offsets overlapping pins with leader geometry.
5. **Auto-fit Bounds:** `map.fitBounds(pinBounds, { padding: [56, 56] })` ensures pins and radius ring are never clipped by the viewport.

---

## 🚀 2. What's New in LocalKart v2

### For Customers
1. **Live Crowd & Billing Queue Meter:** Shows *Quiet now*, *Moderate*, *Busy* with billing wait time (~3 min).
2. **Best Time to Visit Chart:** 24-hour hourly footfall bar chart with the current hour highlighted in Marigold.
3. **Stock Confidence Labels:** *Live from shelf camera, 2 min ago* (simulated) vs *Updated by owner, 3 h ago*.
4. **Reserve & Pick Up (30-Minute Hold):** Hold items for 30 minutes with zero advance payment, featuring an animated countdown ring and directions to eliminate wasted trips.
5. **Smart Basket Optimizer:** Pure algorithm (`optimizeBasket`) comparing **cheapest single store** vs **best split across 2 stores**, accounting for delivery fees with plain explanations.
6. **Can't Find It? Ask Nearby Shops:** Broadcast inquiry for hard-to-find items to 14+ Pollachi merchants; receive live price quotations.
7. **Tamil Voice Search & Simple Mode:** Web Speech API microphone search (`ta-IN` / `en-IN`) and an elderly-friendly Simple Mode toggle with larger typography and 1-tap call buttons.
8. **Neighbourhood Group Delivery:** Street delivery pool widget with falling delivery fees as more neighbors join (split from ₹20 down to ₹5).
9. **Monthly Groceries 1-Tap Reorder:** Rebuilds cart from the cheapest local merchants in a single click.
10. **Price Watch:** Bell icon alerts customers when an out-of-stock item returns or drops in price.

### For Shop Owners (`/shop` – 10-Tab Portal)
1. **Overview:** Daily sales count-up, cash vs UPI breakdown, busy status, and 3 smart proactive alerts.
2. **Stock Management:** Cost price, selling price, profit margin (%), expiry classification (OK, 7-day alert, expired), fast `[ - ]` and `[ + ]` controls, barcode scanning, CSV export, and WhatsApp reorder link generator.
3. **Money (Spend & Profit):** 10-second expense entry, animated Sales vs Expenses vs Profit Recharts, P&L summary, and Day-Closing cash difference reconciliation.
4. **Khata (Credit Ledger):** Customer credit accounts, overdue aging (0–7, 8–30, 30+ days), and prefilled WhatsApp payment reminder generator.
5. **Insights & Customer Demand:**
   - **Lost Demand Ranking:** Items customers searched or requested that were not in stock (highest value card).
   - **Frequently Bought Together:** Cross-selling combo suggestions (e.g. Rice + Toor Dal).
   - **7-Day Demand Forecast:** Time-series area chart with confidence bounds.
6. **Smart Shelf (CCTV Stock Monitor):** SVG-rendered camera racks, sweeping laser scanner, animated bounding boxes with confidence scores (`Ponni Rice 1kg · 8 units · 0.94`), gap detection, and Shelf vs System reconciliation table.
7. **Crowd & Queues (Department Store Mode):** Live footfall, interactive SVG floor plan heatmap with breathing hot zones, billing queue monitor, time-slider day replay, best sellers by zone, and privacy panel.
8. **Customer Requests:** Inbox of "Can't Find It?" inquiries with 2-tap price quotations.
9. **Settings:** Store profile, delivery radius, edge camera RTSP endpoints, and ethics disclaimers.
10. **Orders Queue:** Packing, dispatch, and pickup fulfillment workflows.

---

## 🧪 3. 3-Minute Viva Demonstration Script

1. **Step 1 (Hyperlocal Map & Price Pins):** Open the app in Pollachi, type `"rice"` in the search bar. Note how map pins update dynamically, cheapest turns Marigold with anchor tails, and pins never overlap.
2. **Step 2 (Crowd & Stock Confidence):** Open *Mahalingam Mandi*. Point out the *Quiet now* badge, estimated 3-min billing wait, the 24-hour *Best Time to Visit* chart, and the *Live from shelf camera* stock confidence tag.
3. **Step 3 (Customer Features):** Tap *Hold 30m* on Ponni Rice to demonstrate the 30-minute reservation ring. Open *Smart Basket* and toggle between *Single Store* and *Split 2 Stores* to show the algorithmic cost comparison.
4. **Step 4 (Owner Portal – Money & P&L):** Switch to `/shop` (Shop Owner). Open the *Money* tab, record an expense in under 10 seconds, view the P&L gross margin, and show the Day-Closing expected vs counted cash difference.
5. **Step 5 (Smart Shelf & Lost Demand):** Open the *Smart Shelf* tab. Watch the sweeping laser scan catch an empty slot on Rack-A2 (*2 packs missing*). Tap *+ Restock* to create a staff task. Switch to *Insights* to show the *Lost Demand* table.
6. **Step 6 (Department Store Crowd Heatmap):** Switch to *Pollachi Super Centre* (Department Store) and open the *Crowd* tab. Drag the time slider from 9 AM to 7 PM to watch the floor plan heatmap breathe, and open Counter 3 upon bottleneck alert.
7. **Step 7 (Academic Disclosure):** Open *Account > Academic Rigor & Honesty Disclosure*. Review the explicit table of Real vs Simulated features, ethics compliance ("No faces stored"), and TRL 3 certification.

---

## 🎨 Design System & Heat Tokens

| Token | CSS Variable | Hex | Usage |
|---|---|---|---|
| **Palm** | `--palm` | `#0E3B2C` | Primary surfaces, app bar, headers, buttons |
| **Grove** | `--grove` | `#1F6B4A` | Secondary buttons, verified merchant badges |
| **Marigold** | `--marigold` | `#FFB400` | Single #1 winning deal, best options, active CTA |
| **Chalk** | `--chalk` | `#F7F9F4` | Clean canvas background |
| **Ink** | `--ink` | `#14201B` | High-contrast typography |
| **Chilli** | `--chilli` | `#D63A2F` | Out of stock, empty shelf gaps, overdue khata |
| **Heat Quiet** | `--heat-quiet` | `#2E7D32` | Low crowd density (Green) |
| **Heat Moderate** | `--heat-moderate` | `#FFB400` | Moderate crowd density (Yellow) |
| **Heat Busy** | `--heat-busy` | `#D63A2F` | High crowd bottleneck (Red) |

---

## 💻 Tech Stack & Verification

- **Frontend:** React 19 + TypeScript + Vite 8
- **Styling:** Tailwind CSS v4 + Motion tokens (`src/styles/motion.ts`)
- **Maps:** Leaflet + `react-leaflet` + OpenStreetMap
- **Charts:** Recharts (responsive animated Area/Bar charts) + Hand-crafted SVG Floor Plan Heatmap
- **Edge ML Demo:** TensorFlow.js (`@tensorflow/tfjs` + `@tensorflow-models/coco-ssd`) dynamically code-split
- **Voice & Accessibility:** Native Web Speech API (`ta-IN`, `en-IN`) + Simple Mode store
- **Testing:** Vitest with 15 passing tests for Haversine distance, basket optimization, day-closing cash difference, P&L, and seeded random determinism.

### Build and Test Commands

```bash
# 1. Install dependencies
npm install

# 2. Run unit test suite
npm run test

# 3. Build production bundle (type checks + Vite bundle)
npm run build

# 4. Start local development server
npm run dev
```

Open `http://localhost:5173` to explore LocalKart v2.
