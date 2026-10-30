# LocalKart v2 – Machine Learning & Edge Vision Architecture Plan

> **Academic Project Document**  
> **Status:** Future Work / TRL 4+ Roadmap  
> **Current Prototype Classification:** TRL 3 (Proof of Concept – Simulated Layer & In-Browser COCO-SSD Evaluation)  
> **Institution:** Department of Computer Science & Engineering, Sri Eshwar College of Engineering  

---

## 1. Executive Summary

LocalKart v1 solved the hyperlocal search challenge (*"which nearby shop has it, cheapest, closest"*). LocalKart v2 introduces automated inventory observability, lost-demand tracking, and floor crowd intelligence to bridge retail operational gaps for shop owners in Pollachi, Tamil Nadu.

In the current TRL 3 prototype, the ML services run through a deterministic seeded simulation layer (`src/ml-sim/mockMLService.ts`) with a client-side in-browser demonstration powered by TensorFlow.js (`@tensorflow-models/coco-ssd`). This document specifies the planned technical architecture, model selection, dataset requirements, and edge deployment strategy for future production scaling (TRL 4 to TRL 6).

---

## 2. Planned ML Capabilities & Technical Approaches

| Need | Planned Technical Approach | Data Requirements | Latency / Hardware Target |
|---|---|---|---|
| **Shelf Stock & Gap Detection** | Object detection using fine-tuned **YOLOv8-Nano** / **YOLOv11** on bounding boxes of localized packaged groceries, combined with polygon-based empty-slot vacancy classifiers. | 1,500+ annotated shelf photographs from local partner shops in Pollachi across multiple lighting conditions and rack heights. | < 500 ms inference on NVIDIA Jetson Orin Nano / Raspberry Pi 5 with Hailo-8 AI accelerator. |
| **People Counting & Zone Density** | Pretrained person detector with **ByteTrack** / **DeepSORT** multi-object tracking. Centroid counting inside pre-annotated store zone polygons. **Zero biometric or facial storage**. | Continuous low-resolution CCTV RTSP feeds (1080p @ 10–15 fps) and store floor plan polygon maps. | Real-time edge inference (15 fps), transmitting only scalar counts `[zone_id, count]` to the cloud. |
| **Billing Queue & Checkout Wait Estimation** | Density person counting strictly within the billing queue ROI (Region of Interest) polygon, coupled with Little's Law formula for wait calculation: $W = L / \lambda$. | Bounding boxes inside cashier counter polygons, historical transaction timestamps from the POS ledger. | Evaluated every 10 seconds. |
| **Demand Forecasting** | Hybrid time-series forecasting: **Seasonal Naive Baseline** combined with **LightGBM** / **Prophet**, ingesting local calendar events (e.g., Pollachi Market Day on Tuesdays, Aadi festival surges, Pongal holiday shopping). | Daily sales quantity per SKU, retail historical bills (minimum 6–12 months). | Batch inference run daily at 11:59 PM. |
| **Frequently Bought Together (Cross-Selling)** | Frequent itemset mining via **Apriori** and **FP-Growth** algorithms over customer transaction bills, outputting minimum support $\ge 0.05$ and confidence $\ge 0.60$. | Itemized bill line items from the POS database. | Daily or weekly offline matrix generation. |
| **Lost Demand & Inventory Leakage** | Aggregation pipeline capturing zero-result search queries and customer "Can't Find It?" broadcast requests, cross-referenced with catalog out-of-stock events. | Customer search logs, unsatisfied request tickets, and zero-inventory offer timestamps. | Real-time streaming aggregation into store insights dashboard. |

---

## 3. Edge Computing & Privacy-Preserving Architecture

Traditional cloud computer vision sends raw, high-bandwidth RTSP video streams across internet connections. In tier-2/3 Indian towns such as Pollachi, bandwidth is limited and privacy regulations strictly prohibit transmitting customer surveillance footage off-premises.

LocalKart's future deployment adopts an **Edge-Gateway Architecture**:

```
[ Store Cameras (RTSP) ]
         │
         ▼
[ Edge Device in Store (Jetson Nano / Raspberry Pi 5) ]
  ├── 1. Frame capture & preprocessing
  ├── 2. Local YOLO Person / Shelf Inference
  ├── 3. Bounding box & centroid computation
  ├── 4. Anonymization: Discard raw frames immediately
  └── 5. Encrypt and extract scalar JSON payloads
         │
         ▼ (Encrypted HTTPS / MQTT - Only numbers, NO VIDEO)
[ LocalKart Central Cloud Server ]
  ├── Aggregate Zone Heatmaps
  ├── Real-Time Customer Crowd Meter ("Quiet", "Moderate", "Busy")
  └── POS vs Shelf Stock Reconciliation
```

### Privacy & Ethics Guardrails:
1. **No Facial Recognition:** No face detection models, facial embeddings, or demographic classifiers are installed.
2. **Ephemerality:** Camera frames are processed in volatile RAM buffers and immediately overwritten after centroid extraction.
3. **Data Sovereignty:** Physical video feeds never leave the merchant's premises.

---

## 4. Software Interfaces & Drop-in Replacement

The codebase is built with strict interface segregation. The ML service interface in `src/types/ml.ts`:

```typescript
export interface MLService {
  getShelfStatus(shopId: string, cameraId: string): Promise<ShelfStatus>;
  getCrowd(shopId: string): Promise<CrowdSnapshot>;
  getFootfallByHour(shopId: string, date: string): Promise<number[]>;
  getZoneDensity(shopId: string): Promise<ZoneDensity[]>;
  getDemandForecast(shopId: string, productId: string, days: number): Promise<ForecastPoint[]>;
  getAssociations(shopId: string): Promise<ProductPair[]>;
}
```

In v2, `mockMLService` implements this interface using a deterministic Mulberry32 seed (`localkart_pollachi_v2`). When transitioning to a production cloud backend, `httpMLService` will consume the exact same JSON schema via REST/gRPC endpoints without modifying any UI component.

---

## 5. Roadmap & TRL Milestones

- **TRL 3 (Current):** Analytical proof of concept, simulated deterministic engine, in-browser COCO-SSD video person detector demonstration.
- **TRL 4 (Laboratory Validation):** Raspberry Pi 5 + Hailo-8 edge testbench running fine-tuned YOLO on 1 mock grocery shelf and 1 camera.
- **TRL 5 (Relevant Environment):** Pilot deployment with 2 partner merchants in Pollachi (1 grocery mandi, 1 department store).
- **TRL 6 (Demonstration Prototype):** Multi-camera multi-tenant edge gateway deployment integrated with local merchant POS terminals.
