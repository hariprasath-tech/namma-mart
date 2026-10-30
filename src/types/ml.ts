export interface Zone {
  id: string;
  name: string;
  polygon: [number, number][]; // Relative percentage coordinates [x, y] in floor plan
}

export interface Camera {
  id: string;
  name: string;
  zoneId: string;
  status: 'online' | 'offline';
  lastFrameAt: string;
}

export interface BoundingBox {
  label: string;
  qty: number;
  confidence: number;
  bbox: [number, number, number, number]; // [x, y, width, height] in normalized percent
}

export interface ShelfGap {
  slot: string;
  productId: string;
  missing: number;
}

export interface ShelfStatus {
  cameraId: string;
  capturedAt: string;
  boxes: BoundingBox[];
  gaps: ShelfGap[];
}

export interface QueueStatus {
  counterId: string;
  length: number;
  waitMins: number;
}

export interface CrowdSnapshot {
  peopleNow: number;
  level: 'quiet' | 'moderate' | 'busy';
  queues: QueueStatus[];
}

export interface ZoneDensity {
  zoneId: string;
  count: number;
  dwellMins: number;
}

export interface ForecastPoint {
  date: string;
  expected: number;
  low: number;
  high: number;
}

export interface ProductPair {
  productA: string;
  productB: string;
  frequency: number;
  suggestion: string;
}

/**
 * Common ML interface - implemented by mockMLService and future real ML backend
 */
export interface MLService {
  getShelfStatus(shopId: string, cameraId: string): Promise<ShelfStatus>;
  getCrowd(shopId: string): Promise<CrowdSnapshot>;
  getFootfallByHour(shopId: string, date: string): Promise<number[]>;
  getZoneDensity(shopId: string): Promise<ZoneDensity[]>;
  getDemandForecast(shopId: string, productId: string, days: number): Promise<ForecastPoint[]>;
  getAssociations(shopId: string): Promise<ProductPair[]>;
}
