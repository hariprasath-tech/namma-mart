import { describe, it, expect } from 'vitest';
import { calculateDistanceKm, formatDistance } from '../lib/haversine';
import { compareOffers } from '../lib/compareOffers';
import { optimizeBasket, BasketItem } from '../lib/optimizeBasket';
import {
  classifyExpiryState,
  classifyCrowdLevel,
  calculateDayClosingDifference,
  calculateProfitAndLoss,
  calculateGroupOrderFee,
} from '../lib/classifiers';
import { createSeededRandom } from '../ml-sim/seededRandom';
import { MockMLService } from '../ml-sim/mockMLService';
import { Shop, Product, Offer, LocationCoords } from '../types';

describe('Haversine Distance Engine', () => {
  it('returns 0 km for identical coordinates', () => {
    const dist = calculateDistanceKm(10.6586, 77.0084, 10.6586, 77.0084);
    expect(dist).toBe(0);
  });

  it('calculates realistic distance between Pollachi Central and Mahalingapuram (~1.7 km)', () => {
    const dist = calculateDistanceKm(10.6586, 77.0084, 10.6670, 77.0220);
    expect(dist).toBeGreaterThan(1.2);
    expect(dist).toBeLessThan(2.2);
  });

  it('calculates distance between Pollachi and Kinathukadavu (~18 km)', () => {
    const dist = calculateDistanceKm(10.6586, 77.0084, 10.8200, 77.0200);
    expect(dist).toBeGreaterThan(16);
    expect(dist).toBeLessThan(20);
  });

  it('formats distance correctly in meters or kilometers', () => {
    expect(formatDistance(0.45)).toBe('450 m');
    expect(formatDistance(1.84)).toBe('1.8 km');
    expect(formatDistance(12.0)).toBe('12.0 km');
  });
});

describe('Compare Offers Engine', () => {
  const dummyProduct: Product = {
    id: 'p-1',
    name: 'Ponni Boiled Rice (1kg)',
    category: 'Grocery',
    unit: '1 kg',
    image: '',
    description: 'Fresh aged rice',
  };

  const dummyShops: Shop[] = [
    {
      id: 's-1',
      name: 'Sri Krishna Maligai',
      shortName: 'Sri Krishna',
      type: 'small',
      verified: true,
      avgReplyMins: 5,
      area: 'Bazaar Street',
      address: '42, Bazaar St',
      phone: '9443182301',
      lat: 10.6612,
      lng: 77.0075,
      rating: 4.8,
      reviewCount: 180,
      openNow: true,
      hours: '8 AM - 9 PM',
      delivery: true,
      pickup: true,
      categories: ['Grocery'],
    },
    {
      id: 's-2',
      name: 'Selvi Supermarket',
      shortName: 'Selvi Super',
      type: 'department',
      verified: true,
      avgReplyMins: 8,
      area: 'Palakkad Road',
      address: '118, Palakkad Rd',
      phone: '9842241109',
      lat: 10.6534,
      lng: 77.0012,
      rating: 4.6,
      reviewCount: 200,
      openNow: true,
      hours: '8 AM - 10 PM',
      delivery: false,
      pickup: true,
      categories: ['Grocery'],
    },
    {
      id: 's-3',
      name: 'Mahalingam Rice Mandi',
      shortName: 'Mahalingam',
      type: 'small',
      verified: true,
      avgReplyMins: 10,
      area: 'Market Road',
      address: '15, Market Line',
      phone: '9442053280',
      lat: 10.6595,
      lng: 77.0089,
      rating: 4.9,
      reviewCount: 340,
      openNow: false, // Closed for test
      hours: '7 AM - 8:30 PM',
      delivery: true,
      pickup: true,
      categories: ['Grocery'],
    },
  ];

  const dummyOffers: Offer[] = [
    { id: 'o-1', productId: 'p-1', shopId: 's-1', price: 52, stock: 20 },
    { id: 'o-2', productId: 'p-1', shopId: 's-2', price: 56, stock: 10 },
    { id: 'o-3', productId: 'p-1', shopId: 's-3', price: 48, stock: 40 },
  ];

  const userCoords: LocationCoords = { lat: 10.6586, lng: 77.0084 };

  it('ranks offers by price asc and flags cheapest offer', () => {
    const results = compareOffers(
      'p-1',
      userCoords,
      { sortBy: 'cheapest' },
      dummyOffers,
      dummyShops,
      [dummyProduct]
    );

    expect(results.length).toBe(3);
    expect(results[0].offer.price).toBe(48);
    expect(results[0].isCheapest).toBe(true);
    expect(results[0].shop.id).toBe('s-3');
  });

  it('filters out closed shops when openNowOnly is true', () => {
    const results = compareOffers(
      'p-1',
      userCoords,
      { openNowOnly: true },
      dummyOffers,
      dummyShops,
      [dummyProduct]
    );

    expect(results.length).toBe(2);
    expect(results.some((r) => r.shop.id === 's-3')).toBe(false);
    expect(results[0].isCheapest).toBe(true);
    expect(results[0].shop.id).toBe('s-1');
  });

  it('filters out shops without delivery when hasDeliveryOnly is true', () => {
    const results = compareOffers(
      'p-1',
      userCoords,
      { hasDeliveryOnly: true },
      dummyOffers,
      dummyShops,
      [dummyProduct]
    );

    expect(results.some((r) => r.shop.id === 's-2')).toBe(false);
    expect(results.every((r) => r.shop.delivery)).toBe(true);
  });
});

describe('Smart Basket Optimization', () => {
  const shops: Shop[] = [
    {
      id: 'shop-A',
      name: 'Shop A',
      shortName: 'Shop A',
      type: 'small',
      verified: true,
      avgReplyMins: 5,
      area: 'Area A',
      address: '',
      phone: '',
      lat: 10.65,
      lng: 77.0,
      rating: 4.8,
      reviewCount: 50,
      openNow: true,
      hours: '',
      delivery: true,
      pickup: true,
      categories: ['Grocery'],
    },
    {
      id: 'shop-B',
      name: 'Shop B',
      shortName: 'Shop B',
      type: 'small',
      verified: true,
      avgReplyMins: 5,
      area: 'Area B',
      address: '',
      phone: '',
      lat: 10.66,
      lng: 77.01,
      rating: 4.7,
      reviewCount: 60,
      openNow: true,
      hours: '',
      delivery: true,
      pickup: true,
      categories: ['Grocery'],
    },
  ];

  // In Shop A: item 1 is ₹50, item 2 is ₹150 (Total ₹200)
  // In Shop B: item 1 is ₹80, item 2 is ₹100 (Total ₹180)
  // Split across A & B: item 1 at A (₹50) + item 2 at B (₹100) = ₹150 items
  // Delivery fee: Single = ₹20, Split = ₹40 (2 deliveries)
  // Single B total = 180 + 20 = 200
  // Split A+B total = 150 + 40 = 190 (Savings of ₹10!)
  const offers: Offer[] = [
    { id: 'o-1', productId: 'p-1', shopId: 'shop-A', price: 50, stock: 10 },
    { id: 'o-2', productId: 'p-2', shopId: 'shop-A', price: 150, stock: 10 },
    { id: 'o-3', productId: 'p-1', shopId: 'shop-B', price: 80, stock: 10 },
    { id: 'o-4', productId: 'p-2', shopId: 'shop-B', price: 100, stock: 10 },
  ];

  const basket: BasketItem[] = [
    { productId: 'p-1', qty: 1 },
    { productId: 'p-2', qty: 1 },
  ];

  it('computes cheapest single vs best split across stores', () => {
    const res = optimizeBasket(basket, offers, shops, { lat: 10.65, lng: 77.0 }, 'delivery');

    expect(res.cheapestSingle).toBeDefined();
    expect(res.cheapestSingle?.shop.id).toBe('shop-B');
    expect(res.cheapestSingle?.total).toBe(200); // 180 + 20 delivery

    expect(res.bestSplit).toBeDefined();
    expect(res.bestSplit?.total).toBe(190); // 150 + 40 delivery
    expect(res.bestSplit?.savingsVsSingle).toBe(10);
    expect(res.recommendation).toBe('split');
  });
});

describe('Classifiers and Business Logic', () => {
  it('classifies expiry state correctly', () => {
    const now = new Date('2026-10-30T12:00:00Z');
    expect(classifyExpiryState('2026-10-25T00:00:00Z', now)).toBe('expired');
    expect(classifyExpiryState('2026-11-03T00:00:00Z', now)).toBe('expiring_soon');
    expect(classifyExpiryState('2026-11-20T00:00:00Z', now)).toBe('ok');
    expect(classifyExpiryState(undefined, now)).toBe('ok');
  });

  it('classifies crowd levels based on thresholds', () => {
    expect(classifyCrowdLevel(12)).toBe('quiet');
    expect(classifyCrowdLevel(24)).toBe('quiet');
    expect(classifyCrowdLevel(25)).toBe('moderate');
    expect(classifyCrowdLevel(55)).toBe('moderate');
    expect(classifyCrowdLevel(56)).toBe('busy');
  });

  it('computes day closing cash differences accurately', () => {
    const balanced = calculateDayClosingDifference(5000, 5000);
    expect(balanced.difference).toBe(0);
    expect(balanced.status).toBe('balanced');

    const short = calculateDayClosingDifference(5000, 4850);
    expect(short.difference).toBe(-150);
    expect(short.status).toBe('short');

    const excess = calculateDayClosingDifference(5000, 5120);
    expect(excess.difference).toBe(120);
    expect(excess.status).toBe('excess');
  });

  it('calculates profit and loss metrics and gross margin correctly', () => {
    const pnl = calculateProfitAndLoss(10000, 6000, 1500);
    expect(pnl.grossProfit).toBe(4000);
    expect(pnl.netProfit).toBe(2500);
    expect(pnl.marginPct).toBe(25);
  });

  it('calculates neighbourhood group order decreasing fee', () => {
    expect(calculateGroupOrderFee(40, 1, 5, 10)).toBe(40);
    expect(calculateGroupOrderFee(40, 3, 5, 10)).toBe(25);
    expect(calculateGroupOrderFee(40, 5, 5, 10)).toBe(10);
    expect(calculateGroupOrderFee(40, 8, 5, 10)).toBe(10); // Floor at minFee
  });
});

describe('Seeded Simulation Determinism & Forecast Bounds', () => {
  it('produces identical random sequences from identical seeds', () => {
    const rngA = createSeededRandom('pollachi_seed_test');
    const rngB = createSeededRandom('pollachi_seed_test');

    const seqA = [rngA(), rngA(), rngA(), rngA()];
    const seqB = [rngB(), rngB(), rngB(), rngB()];

    expect(seqA).toEqual(seqB);
  });

  it('ensures forecast output shape adheres to low <= expected <= high', async () => {
    const ml = new MockMLService('test_forecast_seed');
    const forecast = await ml.getDemandForecast('shop-1', 'prod-1', 7);

    expect(forecast.length).toBe(7);
    forecast.forEach((pt) => {
      expect(pt.low).toBeLessThanOrEqual(pt.expected);
      expect(pt.expected).toBeLessThanOrEqual(pt.high);
    });
  });
});
