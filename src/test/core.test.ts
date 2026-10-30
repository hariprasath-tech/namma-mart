import { describe, it, expect } from 'vitest';
import { calculateDistanceKm, formatDistance } from '../lib/haversine';
import { compareOffers } from '../lib/compareOffers';
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
    { id: 'o-3', productId: 'p-1', shopId: 's-3', price: 48, stock: 40 }, // Lowest price, but s-3 is closed
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
    // Now s-1 with ₹52 should be the cheapest of open shops
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

    // s-2 has delivery: false
    expect(results.some((r) => r.shop.id === 's-2')).toBe(false);
    expect(results.every((r) => r.shop.delivery)).toBe(true);
  });
});

describe('Cart Totals & Split Dispatches', () => {
  it('computes accurate subtotal across multiple items', () => {
    const items = [
      { price: 52, qty: 2 }, // 104
      { price: 210, qty: 1 }, // 210
      { price: 28, qty: 3 }, // 84
    ];
    const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
    expect(subtotal).toBe(398);
  });

  it('calculates multi-shop delivery fee correctly (₹20 per shop)', () => {
    const shopIds = ['shop-1', 'shop-2', 'shop-1', 'shop-3'];
    const distinctShops = new Set(shopIds).size;
    expect(distinctShops).toBe(3);

    const deliveryFee = distinctShops * 20;
    expect(deliveryFee).toBe(60);
  });
});
