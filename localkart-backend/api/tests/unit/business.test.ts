import { describe, it, expect } from 'vitest';
import {
  haversine,
  compareOffers,
  optimizeBasket,
  calcPnl,
  closeDay,
  classifyExpiry,
  classifyCrowd,
  groupFee,
  stockConfidence,
} from '../../src/lib/business.js';

describe('LocalKart v3 - Pure Business Logic Unit Tests', () => {
  // 1. Haversine Formula Tests
  describe('haversine', () => {
    const pollachiBazaar = { lat: 10.6612, lng: 77.0075 };
    const mahalingapuram = { lat: 10.6582, lng: 77.0021 };
    const kinathukadavu = { lat: 10.8228, lng: 77.0205 };

    it('calculates zero distance for identical coordinates', () => {
      expect(haversine(pollachiBazaar, pollachiBazaar)).toBe(0);
    });

    it('is strictly symmetric: d(A, B) === d(B, A)', () => {
      const d1 = haversine(pollachiBazaar, mahalingapuram);
      const d2 = haversine(mahalingapuram, pollachiBazaar);
      expect(d1).toBe(d2);
      expect(d1).toBeGreaterThan(500);
      expect(d1).toBeLessThan(1000); // ~680 metres
    });

    it('accurately measures town-to-town distances (Pollachi to Kinathukadavu ~18km)', () => {
      const dist = haversine(pollachiBazaar, kinathukadavu);
      expect(dist).toBeGreaterThan(17000);
      expect(dist).toBeLessThan(19000);
    });
  });

  // 2. compareOffers Tests
  describe('compareOffers', () => {
    const userLoc = { lat: 10.6609, lng: 77.0048 };

    const mockOffers = [
      {
        id: 'off-1',
        price: 5200, // ₹52
        stock: 10,
        shop: {
          id: 's-1',
          name: 'Store A',
          lat: 10.6612,
          lng: 77.0075,
          rating: 4.8,
          openNow: true,
          delivery: true,
          pickup: true,
        },
      },
      {
        id: 'off-2',
        price: 4800, // ₹48 (Cheapest)
        stock: 5,
        shop: {
          id: 's-2',
          name: 'Store B',
          lat: 10.6680,
          lng: 77.0120,
          rating: 4.5,
          openNow: true,
          delivery: true,
          pickup: true,
        },
      },
      {
        id: 'off-3',
        price: 5500,
        stock: 0, // OUT OF STOCK
        shop: {
          id: 's-3',
          name: 'Store C',
          lat: 10.6600,
          lng: 77.0040,
          rating: 4.9,
          openNow: true,
          delivery: true,
          pickup: true,
        },
      },
    ];

    it('ranks offers by price and marks cheapest correctly', () => {
      const ranked = compareOffers(mockOffers, userLoc, { sortBy: 'cheapest' });
      expect(ranked.length).toBe(2); // Out of stock excluded
      expect(ranked[0].shopId).toBe('s-2');
      expect(ranked[0].isCheapest).toBe(true);
      expect(ranked[0].price).toBe(4800);
    });

    it('excludes out-of-stock offers automatically', () => {
      const ranked = compareOffers(mockOffers, userLoc);
      const hasOutOfStock = ranked.some((r) => r.stock === 0);
      expect(hasOutOfStock).toBe(false);
    });

    it('filters by minimum rating', () => {
      const ranked = compareOffers(mockOffers, userLoc, { minRating: 4.7 });
      expect(ranked.length).toBe(1);
      expect(ranked[0].shopId).toBe('s-1');
    });
  });

  // 3. optimizeBasket Tests
  describe('optimizeBasket', () => {
    const list = [
      { productId: 'p-rice', qty: 2 },
      { productId: 'p-oil', qty: 1 },
    ];

    it('recommends single shop when duplicate delivery fees outweigh item discounts', () => {
      // Store A: Rice ₹50 (5000p), Oil ₹200 (20000p) -> Subtotal 30000 + 2000 delivery = 32000p
      // Store B: Rice ₹49 (4900p), Oil ₹200 (20000p) -> Split saves ₹2 on rice (200p) but pays +₹20 (2000p) delivery
      const offers = [
        { productId: 'p-rice', shopId: 's-1', shopName: 'Shop A', price: 5000 },
        { productId: 'p-oil', shopId: 's-1', shopName: 'Shop A', price: 20000 },
        { productId: 'p-rice', shopId: 's-2', shopName: 'Shop B', price: 4900 },
        { productId: 'p-oil', shopId: 's-2', shopName: 'Shop B', price: 20000 },
      ];

      const res = optimizeBasket(list, offers, 2000);
      expect(res.recommendation).toBe('single');
      expect(res.bestSingle?.shopId).toBe('s-2');
      expect(res.explanation).toContain('cheaper overall');
    });

    it('recommends split 2 shops when large price difference exceeds delivery fee', () => {
      // Store A: Rice ₹50 (5000p), Oil ₹280 (28000p)
      // Store B: Rice ₹70 (7000p), Oil ₹190 (19000p)
      // Single A: 10000 + 28000 + 2000 = 40000p
      // Single B: 14000 + 19000 + 2000 = 35000p
      // Split: Rice from A (10000) + Oil from B (19000) + 4000 delivery = 33000p (Saves ₹20 vs Single B)
      const offers = [
        { productId: 'p-rice', shopId: 's-1', shopName: 'Shop A', price: 5000 },
        { productId: 'p-oil', shopId: 's-1', shopName: 'Shop A', price: 28000 },
        { productId: 'p-rice', shopId: 's-2', shopName: 'Shop B', price: 7000 },
        { productId: 'p-oil', shopId: 's-2', shopName: 'Shop B', price: 19000 },
      ];

      const res = optimizeBasket(list, offers, 2000);
      expect(res.recommendation).toBe('split');
      expect(res.bestSplit?.grandTotal).toBe(33000);
      expect(res.bestSplit?.savingsVsSingle).toBe(2000); // ₹20 saved
    });
  });

  // 4. Financial Calculations (calcPnl & closeDay)
  describe('calcPnl and closeDay', () => {
    it('correctly calculates gross margin and net profit', () => {
      const sales = 1000000; // ₹10,000 in paise
      const expenses = [
        { amount: 50000, category: 'rent' },
        { amount: 20000, category: 'electricity' },
      ];

      const pnl = calcPnl(sales, expenses, 0.76);
      expect(pnl.revenue).toBe(1000000);
      expect(pnl.cogs).toBe(760000);
      expect(pnl.grossMargin).toBe(24); // 24%
      expect(pnl.totalExpenses).toBe(70000);
      expect(pnl.netProfit).toBe(170000); // 240,000 - 70,000 = 170,000 paise (₹1,700)
    });

    it('identifies day-close status: matched, short, and over', () => {
      expect(closeDay(500000, 500000).status).toBe('matched');
      expect(closeDay(500000, 480000).status).toBe('short');
      expect(closeDay(500000, 480000).difference).toBe(-20000); // -₹200
      expect(closeDay(500000, 510000).status).toBe('over');
    });
  });

  // 5. Inventory Classifiers (classifyExpiry & stockConfidence)
  describe('classifyExpiry and stockConfidence', () => {
    const today = new Date('2026-10-30T10:00:00Z');

    it('classifies expired dates as expired', () => {
      expect(classifyExpiry('2026-10-25', today)).toBe('expired');
    });

    it('classifies dates within 7 days as expiring', () => {
      expect(classifyExpiry('2026-11-04', today)).toBe('expiring');
    });

    it('classifies distant future dates as ok', () => {
      expect(classifyExpiry('2026-12-30', today)).toBe('ok');
    });

    it('identifies stale stock timestamps older than 24h', () => {
      const freshDate = new Date('2026-10-30T08:00:00Z');
      const staleDate = new Date('2026-10-28T08:00:00Z');

      expect(stockConfidence('camera', freshDate, today).stale).toBe(false);
      expect(stockConfidence('owner', staleDate, today).stale).toBe(true);
    });
  });

  // 6. Crowd Level and Group Fee
  describe('classifyCrowd and groupFee', () => {
    it('classifies crowd thresholds', () => {
      expect(classifyCrowd(12, 100)).toBe('quiet');
      expect(classifyCrowd(35, 100)).toBe('moderate');
      expect(classifyCrowd(75, 100)).toBe('busy');
    });

    it('calculates group delivery fee scaling with safety floor', () => {
      const baseFee = 2000; // ₹20
      expect(groupFee(baseFee, 1)).toBe(2000);
      expect(groupFee(baseFee, 2)).toBe(1000); // ₹10
      expect(groupFee(baseFee, 4)).toBe(500);  // ₹5
      expect(groupFee(baseFee, 10)).toBe(500); // Capped at ₹5 floor
    });
  });
});
