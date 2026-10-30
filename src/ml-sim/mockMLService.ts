import {
  MLService,
  ShelfStatus,
  CrowdSnapshot,
  ZoneDensity,
  ForecastPoint,
  ProductPair,
} from '../types/ml';
import { createSeededRandom } from './seededRandom';

export class MockMLService implements MLService {
  private rng: () => number;

  constructor(seed = 'localkart_pollachi_v2') {
    this.rng = createSeededRandom(seed);
  }

  async getShelfStatus(shopId: string, cameraId: string): Promise<ShelfStatus> {
    // Simulated short latency of edge camera inference
    await new Promise((r) => setTimeout(r, 60));

    const isCam1 = cameraId.includes('1') || cameraId === 'cam-grains';

    if (isCam1) {
      return {
        cameraId,
        capturedAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
        boxes: [
          { label: 'Ponni Rice 1kg', qty: 12, confidence: 0.94, bbox: [12, 18, 38, 30] },
          { label: 'Sona Masoori 1kg', qty: 10, confidence: 0.91, bbox: [54, 18, 34, 30] },
          { label: 'Toor Dal 1kg', qty: 14, confidence: 0.96, bbox: [12, 54, 40, 32] },
        ],
        gaps: [
          { slot: 'Rack-A2', productId: 'prod-1', missing: 2 },
        ],
      };
    }

    return {
      cameraId,
      capturedAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
      boxes: [
        { label: 'Cold-Pressed Coconut Oil 1L', qty: 16, confidence: 0.97, bbox: [10, 20, 36, 32] },
        { label: 'Palm Jaggery 500g', qty: 18, confidence: 0.89, bbox: [52, 20, 38, 32] },
        { label: 'Tata Salt 1kg', qty: 24, confidence: 0.95, bbox: [10, 56, 42, 30] },
      ],
      gaps: [],
    };
  }

  async getCrowd(shopId: string): Promise<CrowdSnapshot> {
    await new Promise((r) => setTimeout(r, 40));

    const hour = new Date().getHours();
    // Time of day footfall multiplier (Pollachi shopping patterns)
    let basePeople = 22;
    if (hour >= 9 && hour <= 12) basePeople = 48; // Morning peak
    else if (hour >= 17 && hour <= 20) basePeople = 68; // Evening peak
    else if (hour >= 13 && hour <= 15) basePeople = 18; // Post-lunch quiet

    const peopleNow = Math.round(basePeople + (this.rng() * 12 - 6));

    let level: 'quiet' | 'moderate' | 'busy' = 'quiet';
    if (peopleNow > 60) level = 'busy';
    else if (peopleNow >= 25) level = 'moderate';

    const queue1Len = Math.max(1, Math.round(peopleNow * 0.08));
    const queue2Len = Math.max(1, Math.round(peopleNow * 0.12));

    return {
      peopleNow,
      level,
      queues: [
        { counterId: 'Counter 1 (Express)', length: queue1Len, waitMins: Math.round(queue1Len * 1.4) },
        { counterId: 'Counter 2 (Regular)', length: queue2Len, waitMins: Math.round(queue2Len * 1.6) },
      ],
    };
  }

  async getFootfallByHour(shopId: string, date: string): Promise<number[]> {
    await new Promise((r) => setTimeout(r, 50));

    // 24-hour retail curve for Pollachi:
    // 0-6: closed (0)
    // 7-8: opening (8, 18)
    // 9-11: morning rush (42, 58, 62)
    // 12-14: lunch lull (34, 22, 19)
    // 15-16: afternoon pickup (28, 40)
    // 17-20: evening high peak (65, 84, 92, 78)
    // 21-22: closing (35, 12)
    // 23: closed (0)
    const baseCurve = [
      0, 0, 0, 0, 0, 0, 0, 8, 18, 42, 58, 62, 34, 22, 19, 28, 40, 65, 84, 92, 78, 35, 12, 0,
    ];

    return baseCurve;
  }

  async getZoneDensity(shopId: string): Promise<ZoneDensity[]> {
    await new Promise((r) => setTimeout(r, 50));

    return [
      { zoneId: 'grocery', count: 14, dwellMins: 9.5 },
      { zoneId: 'dairy', count: 18, dwellMins: 6.2 },
      { zoneId: 'veg', count: 16, dwellMins: 8.0 },
      { zoneId: 'electronics', count: 5, dwellMins: 14.0 },
      { zoneId: 'home', count: 7, dwellMins: 11.2 },
      { zoneId: 'fashion', count: 6, dwellMins: 15.5 },
      { zoneId: 'stationery', count: 4, dwellMins: 7.0 },
      { zoneId: 'billing', count: 11, dwellMins: 5.5 },
    ];
  }

  async getDemandForecast(
    shopId: string,
    productId: string,
    days = 7
  ): Promise<ForecastPoint[]> {
    await new Promise((r) => setTimeout(r, 60));

    const points: ForecastPoint[] = [];
    const today = new Date();

    for (let i = 1; i <= days; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);

      // Weekend bump for Saturday/Sunday
      const dayOfWeek = d.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      const baseSales = isWeekend ? 9.5 : 6.2;
      const expected = Math.round((baseSales + this.rng() * 2) * 10) / 10;
      const low = Math.round(Math.max(1, expected - 2.2) * 10) / 10;
      const high = Math.round((expected + 2.8) * 10) / 10;

      points.push({
        date: d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }),
        expected,
        low,
        high,
      });
    }

    return points;
  }

  async getAssociations(shopId: string): Promise<ProductPair[]> {
    await new Promise((r) => setTimeout(r, 40));

    return [
      {
        productA: 'Ponni Boiled Rice (1kg)',
        productB: 'Pollachi Toor Dal (1kg)',
        frequency: 78,
        suggestion: 'Create South Indian Sambar Combo (Bundle & Save ₹8)',
      },
      {
        productA: 'Pure Cold-Pressed Coconut Oil (1L)',
        productB: 'Erode Turmeric Powder (100g)',
        frequency: 62,
        suggestion: 'Place together on Island Rack near billing counter',
      },
      {
        productA: 'Philips 9W LED Bulb',
        productB: '4-Socket Spike Guard Extension Board (3m)',
        frequency: 44,
        suggestion: 'Cross-merchandise in Hardware & Electricals aisle',
      },
    ];
  }
}

export const mockMLService = new MockMLService();
