# LocalKart v3 – Privacy & Data Protection Architecture

**Maturity Level:** **TRL 3** (Analytical and experimental critical function proof of concept)  
**Scope:** Hyperlocal Retail Computer Vision & Edge Intelligence (Pollachi, Tamil Nadu)

---

## 1. Core Privacy Tenets

LocalKart is engineered to provide dense inventory and crowd intelligence to local shopkeepers without infringing on shopper privacy.

1. **Zero Facial Recognition:** The computer vision pipeline utilizes only pretrained general person bounding box detectors. No facial landmark detection, age/gender profiling, or individual biometric tracking is performed.
2. **Zero Raw Video or Frame Storage:** Video streams and CCTV camera images are decoded exclusively in volatile RAM. Once object coordinates and zone counts are computed, frame buffers are immediately freed and overwritten. No video files or JPEG images are persisted to local hard drives or cloud servers.
3. **Auditing via Hashes Only:** When an edge camera submits a shelf snapshot (`POST /owner/cameras/:id/frame`), only a cryptographic SHA-256 hash of the frame and detected bounding boxes are written to the `ShelfSnapshot` database table.
4. **Aggregate Analytics Only:** Crowd samples (`CrowdSample`, `ZoneSample`) store only aggregated hourly headcounts, zone densities, and queue lengths.

---

## 2. In-Memory Processing Flow

```
[Store CCTV / Edge Camera]
          │  (Multipart JPEG / RTSP Stream)
          ▼
 [RAM Buffer (In-Memory Only)]
          ├── SHA-256 Hash Computed (Frame Hash)
          ├── YOLO / Person Detection Executed
          └── Shapely Polygon Intersection Computed
          │
          ├── [RAM Free / Garbage Collected Immediately]
          ▼
   [Persistent Database]
   Stores:
   - Frame SHA-256 Hash
   - Bounding Boxes JSON
   - Headcount Integer
   - Timestamp
   (NO JPEG, NO MP4, NO FACES)
```

---

## 3. Data Retention & Owner Control

- **Crowd Samples (`CrowdSample`):** Automatically rolled up after 90 days into daily totals and purged from raw granular tables.
- **Search Logs (`SearchLog`):** Customer IP addresses and identifying tokens are never associated with search log rows; queries are stored anonymously to power local unmet demand analytics.
- **Owner Deletion Right:** Store owners retain the capability to purge all camera feeds, snapshots, and shelf logs associated with their establishment.

---

## 4. Automated Verification Test

The ML test suite includes an automated privacy regression test (`ml/tests/test_ml.py::test_privacy_zero_disk_leakage`):
- Executes `analyze_shelf_frame` with a sample image.
- Inspects system temporary directories (`/tmp`, Windows `%TEMP%`) before and after inference.
- Asserts that zero image (`.jpg`, `.png`) or video (`.mp4`, `.avi`) artifacts were created on physical disk during inference.
