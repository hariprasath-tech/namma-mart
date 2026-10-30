import {
  MLService,
  ShelfStatus,
  CrowdSnapshot,
  ZoneDensity,
  ForecastPoint,
  ProductPair,
} from '../types/ml';
import { mockMLService } from './mockMLService';

export class HttpMLService implements MLService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';
  }

  async getShelfStatus(shopId: string, cameraId: string): Promise<ShelfStatus> {
    try {
      const res = await fetch(`${this.baseUrl}/owner/shelf/status`, {
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.snapshot || data;
    } catch {
      // Graceful fallback to mock service if backend not running
      return mockMLService.getShelfStatus(shopId, cameraId);
    }
  }

  async getCrowd(shopId: string): Promise<CrowdSnapshot> {
    try {
      const res = await fetch(`${this.baseUrl}/shops/${shopId}/crowd`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.crowd || data;
    } catch {
      return mockMLService.getCrowd(shopId);
    }
  }

  async getFootfallByHour(shopId: string, date: string): Promise<number[]> {
    try {
      const res = await fetch(`${this.baseUrl}/owner/crowd/footfall?date=${encodeURIComponent(date)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.footfall || data;
    } catch {
      return mockMLService.getFootfallByHour(shopId, date);
    }
  }

  async getZoneDensity(shopId: string): Promise<ZoneDensity[]> {
    try {
      const res = await fetch(`${this.baseUrl}/owner/crowd/zones`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.zones || data;
    } catch {
      return mockMLService.getZoneDensity(shopId);
    }
  }

  async getDemandForecast(shopId: string, productId: string, days: number): Promise<ForecastPoint[]> {
    try {
      const res = await fetch(`${this.baseUrl}/owner/insights/forecast/${productId}?days=${days}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.forecast || data;
    } catch {
      return mockMLService.getDemandForecast(shopId, productId, days);
    }
  }

  async getAssociations(shopId: string): Promise<ProductPair[]> {
    try {
      const res = await fetch(`${this.baseUrl}/owner/insights/bundles`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.bundles || data;
    } catch {
      return mockMLService.getAssociations(shopId);
    }
  }
}

// Selector based on VITE_ML_MODE
export const getActiveMLService = (): MLService => {
  const mode = import.meta.env.VITE_ML_MODE;
  if (mode === 'http') {
    return new HttpMLService();
  }
  return mockMLService;
};

export const activeMLService = getActiveMLService();
