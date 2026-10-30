# LocalKart v2 – UI Bug Fixes & Refinements Audit

This document records the design and UI refinements implemented in LocalKart v2 based on the Nearby Map Hero audit and multi-screen visual inspection.

---

## 1. Nearby Map Hero Fixes

| # | Bug Observed in v1 | Root Cause | Fix Implemented in v2 |
|---|---|---|---|
| **1** | Shop names cut mid-word (*"Sakthi Ele"*, *"Modern Har"*) | `shop.name.slice(0, 10)` in map icon generation | Slicing completely removed. Introduced human-curated `shortName` field (max 16 chars, e.g., *"Sakthi Elec."*, *"Modern Tools"*). Full official store name is displayed in the bottom offer sheet. |
| **2** | Pills clipped text or had rigid boundaries (*"500 m"*) | Fixed Leaflet `iconSize: [110, 32]` and fixed pill widths | Removed fixed widths. Pill containers now size dynamically: `width: max-content; white-space: nowrap; padding: 6px 12px;` with flex layout. |
| **3** | Pins had no geographic anchor point | Flat pill without a pointer stem | Pins now rendered with a distinct downward pointing arrow/tail and a target coordinate dot (`transform: translate(-50%, -100%)`) directly anchoring the pin to the shop's GPS pin. |
| **4** | Poor contrast against OSM road/street tile labels | Semi-transparent borders, no solid backing | Solid `--palm` (`#0E3B2C`) background with crisp 2px `--chalk` (`#F7F9F4`) outline and elevated drop-shadow for active/selected pins. |
| **5** | Zero pricing information when search was empty | Fallback showed only short store name | Dynamic two-tier pin content: **Default state** displays rating and distance (`★4.8 · 450 m`). **Product searched state** highlights price prominently on line 1 (`₹52`), with store name and distance on line 2. |
| **6** | Pins overlapping or clipping container edges | Static map bounds without auto-padding | Map dynamically calls `map.fitBounds(pinBounds, { padding: [56, 56] })`. Added a geometric collision-avoidance offset (24px radial displacement with connecting leader lines) for adjacent stores. |
| **7** | Map canvas was crowded on small screens | Low viewport height (300px) | Height increased to **min 360px on mobile** and **520px on desktop/tablets**. Added accessible floating **Recenter** and **Zoom In / Out** buttons (touch target 46px). |
| **8** | Lack of reactive visual pin feedback | Uniform styling across pins | Implemented 5 clear pin states: `default`, `cheapest` (marigold + pulse), `closest` (grove badge), `selected` (1.08x scale + shadow lift), and `out-of-stock` (subdued grey + strikethrough price). |

---

## 2. Accessibility & General Screen Audit

- **Keyboard Navigation & ARIA:**
  - All Leaflet map pins are now accessible interactive targets with explicit `aria-label` tags (e.g., `aria-label="Selvi Supermarket, Ponni Rice ₹52, 450 metres away"`).
  - Pin triggers respond to `Enter` and `Space` keystrokes.
- **Elderly Usability & Contrast:**
  - Base body font size set to 16px.
  - High-contrast text tokens (`#14201B` on `#F7F9F4` and `#FFFFFF`).
  - Minimum touch targets kept strictly above 44px (average 46px to 52px for primary actions).
- **Empty States & Loading Skeletons:**
  - Shimmer skeletons added for products, search, and store inventory.
  - Actionable empty states with reset filters and suggestions across all screens.
