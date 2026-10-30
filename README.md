# LocalKart (நம்ம Mart)

**Support Local. Shop Meaningful.**  
*Hyperlocal shopping app for Pollachi and nearby towns in Tamil Nadu.*

---

## 🌾 Overview

LocalKart is a hyperlocal commerce platform engineered for small-town markets in Western Tamil Nadu (Pollachi, Kinathukadavu, Anamalai, Udumalpet, Valparai). It enables customers to search for everyday items and instantly view nearby stores with **price, rating, and distance side by side**, helping users decide *which shop, right now* in under 10 seconds.

> **Design Thinking and Innovation Project**  
> Sri Eshwar College of Engineering (Autonomous)  
> Department of Computer Science and Engineering, Batch 2025 to 2029  
> **Mentor:** Dr. S. Sampathkumar, M.Tech., (Ph.D), Head of Department, CSE (Cyber Security)  
> **Team:** Barath M (722825104020), Devdharshan S (722825104033), Hariprasath S (722825104062)

---

## ⚡ The Memorable Moment: The Nearby Map Hero

Replacing traditional generic marketing banners, LocalKart features an interactive **Nearby Map Hero**:
- Full-width interactive map of Pollachi with the user's location at the centre and an 1.8 km dashed radius ring.
- **Dynamic Price Pins:** Live price tags update reactively as you type (e.g., *"₹52 · 0.8 km"*).
- The lowest-priced store automatically highlights in **Marigold** with a pulsing effect (`pulse-marigold`), and the closest shop is tagged with a green badge.
- Tapping any pin pulls up a bottom sheet with the shop's offer, stock count, estimated delivery/pickup time, and direct *"Add to cart"* or *"Compare shops"* actions.

---

## 🚀 Key Features

### For Customers
- **Hyperlocal Location Selector:** Switch between Pollachi Central, Mahalingapuram, Kinathukadavu, Anamalai, Udumalpet, and Valparai, or use GPS detection.
- **10-Second Decision Engine (`/compare`):** Side-by-side comparison table (desktop) and swipeable card deck (mobile) showing Price, Rating, Distance, Stock availability, Delivery/Pickup fulfilment, and Estimated times.
- **Shop-Grouped Cart (`/cart`):** Intelligent multi-vendor cart grouping with visual alerts when items arrive from multiple distinct stores.
- **Simulated Multi-Mode Checkout (`/checkout`):**
  - Choose between **Home Delivery** (with address memory) or **In-Store Pickup** (zero delivery fee).
  - Payment modes: **UPI QR code / ID**, **Credit/Debit Card**, and **Cash on Delivery**.
  - Built-in simulation buttons to test payment success and failure flows.
- **3-Stage Order Stepper (`/orders/:orderId`):** Visual tracking for *Packed* ➔ *Out for delivery* ➔ *Delivered* (or *Ready for pickup* ➔ *Picked up*). Includes interactive star rating and review submission.
- **Bilingual Experience:** Instant English / தமிழ் switch powered by `react-i18next` with `Hind Madurai` typography.
- **Elderly-Friendly & Accessible:** High-contrast color palette, base 16px body type, and 44px+ minimum touch targets.

### For Shop Owners (`/shop`)
- **Today's Orders Queue:** Real-time list of customer orders with one-tap *"Mark Packed"* and *"Dispatch for Delivery"* actions.
- **Instant Product & Stock Manager:**
  - Big, fat `[ - ]` and `[ + ]` stock steppers for effortless inventory adjustments.
  - In-place price editing.
  - Automatic low-stock alerts (`< 5 units left`).
  - Modal to add new products to the town catalog.
  - Instant live synchronization: Merchant stock updates reflect across customer search and map pins in real time.
- **Earnings & Sales Summary:** Estimated daily revenue and order metrics.

---

## 🎨 Design System & Tokens

Crafted to reflect Pollachi's coconut country identity (palm groves, marigold garlands, and morning market streets):

| Token | CSS Variable | Hex | Usage |
|---|---|---|---|
| **Palm** | `--palm` | `#0E3B2C` | Primary surfaces, app bar, headers, buttons |
| **Grove** | `--grove` | `#1F6B4A` | Secondary buttons, success indicators, hover states |
| **Marigold** | `--marigold` | `#FFB400` | Strictly reserved for the single #1 best deal and key CTAs |
| **Chalk** | `--chalk` | `#F7F9F4` | Clean page canvas background |
| **Ink** | `--ink` | `#14201B` | High-contrast body typography |
| **Chilli** | `--chilli` | `#D63A2F` | Warnings, low-stock alerts, payment decline errors |

- **Typography:** Display: *Bricolage Grotesque*; Body, UI & Tamil: *Hind Madurai*.

---

## 🛠️ Tech Stack

- **Framework:** React 18 + Vite 8 + TypeScript
- **Styling:** Tailwind CSS v4 + Design Tokens CSS Variables
- **Mapping:** Leaflet + `react-leaflet` + OpenStreetMap
- **State Management:** Zustand (cart, location, auth, language) with `localStorage` persistence
- **Localization:** `react-i18next` (English & தமிழ்)
- **Icons & Motion:** `lucide-react`, `framer-motion`
- **Testing:** Vitest for Haversine distance engine, comparison ranking, and cart totals

---

## 💻 Getting Started

### Prerequisites
- Node.js 18+ and npm installed.

### Installation & Run

```bash
# 1. Install dependencies
npm install

# 2. Run the development server
npm run dev
```

Open `http://localhost:5173` in your browser.

### Scripts

| Command | Action |
|---|---|
| `npm run dev` | Starts the local development server at `http://localhost:5173` |
| `npm run build` | Compiles TypeScript and builds production bundle |
| `npm run test` | Runs the Vitest test suite (`core.test.ts`) |
| `npm run preview` | Previews the compiled production build locally |

---

## 🧪 Testing

The pure calculation engines are covered by automated unit tests:

```bash
npm run test
```

Tests cover:
1. `haversine`: Great-circle distance calculations between Pollachi coordinates and friendly meter/km formatting.
2. `compareOffers`: Deterministic price ranking, cheapest/closest tagging, and multi-filter exclusion (closed shops, delivery availability).
3. `cart`: Accurate subtotal arithmetic and multi-shop split dispatch delivery fee computation.

---

## 📄 License & Academic Integrity

- **Technology Readiness Level (TRL):** TRL 3 (Proof-of-Concept Prototype).
- **Honesty Disclosure:** All shops, products, inventory numbers, prices, and reviews are simulated sample data for Pollachi town. No real currency is transferred.
- Intended contributions to UN Sustainable Development Goals: SDG 8, SDG 9, and SDG 11.
