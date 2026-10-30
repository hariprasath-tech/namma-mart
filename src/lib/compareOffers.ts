import {
  Offer,
  Shop,
  Product,
  LocationCoords,
  ComparisonFilter,
  OfferComparisonResult,
} from '../types';
import { calculateDistanceKm, formatDistance } from './haversine';

/**
 * Pure comparison engine that ranks product offers across multiple local shops.
 * Deterministic and unit-testable.
 */
export function compareOffers(
  productId: string,
  userLocation: LocationCoords,
  filters: ComparisonFilter = {},
  offers: Offer[],
  shops: Shop[],
  products: Product[]
): OfferComparisonResult[] {
  const product = products.find((p) => p.id === productId);
  if (!product) return [];

  const shopMap = new Map<string, Shop>(shops.map((s) => [s.id, s]));

  // Find all offers for this product from known shops
  const matchedOffers = offers.filter((o) => o.productId === productId && shopMap.has(o.shopId));

  // Build candidate items with distances
  const candidates: { offer: Offer; shop: Shop; distanceKm: number }[] = [];

  for (const offer of matchedOffers) {
    const shop = shopMap.get(offer.shopId)!;
    const distanceKm = calculateDistanceKm(
      userLocation.lat,
      userLocation.lng,
      shop.lat,
      shop.lng
    );

    // Apply filters
    if (filters.maxDistanceKm && distanceKm > filters.maxDistanceKm) continue;
    if (filters.minRating && shop.rating < filters.minRating) continue;
    if (filters.maxPrice && offer.price > filters.maxPrice) continue;
    if (filters.openNowOnly && !shop.openNow) continue;
    if (filters.hasDeliveryOnly && !shop.delivery) continue;
    if (filters.hasPickupOnly && !shop.pickup) continue;

    candidates.push({ offer, shop, distanceKm });
  }

  if (candidates.length === 0) return [];

  // Determine winners
  const minPrice = Math.min(...candidates.map((c) => c.offer.price));
  const minDistance = Math.min(...candidates.map((c) => c.distanceKm));
  const maxRating = Math.max(...candidates.map((c) => c.shop.rating));

  const total = candidates.length;

  const results: OfferComparisonResult[] = candidates.map((item) => {
    const isCheapest = item.offer.price === minPrice;
    const isClosest = item.distanceKm === minDistance;
    const isTopRated = item.shop.rating === maxRating && item.shop.rating >= 4.5;

    let summaryLabel = 'Reliable local shop';
    if (isCheapest && isClosest) {
      summaryLabel = 'Cheapest & closest';
    } else if (isCheapest) {
      summaryLabel = total > 1 ? `Cheapest of ${total} shops` : 'Best price';
    } else if (isClosest) {
      summaryLabel = `Closest shop (${formatDistance(item.distanceKm)})`;
    } else if (isTopRated) {
      summaryLabel = `Top rated (${item.shop.rating.toFixed(1)} ★)`;
    }

    return {
      offer: item.offer,
      shop: item.shop,
      product,
      distanceKm: item.distanceKm,
      isCheapest,
      isClosest,
      isTopRated,
      summaryLabel,
    };
  });

  // Sort results
  const sortBy = filters.sortBy || 'cheapest';
  results.sort((a, b) => {
    if (sortBy === 'cheapest') {
      if (a.offer.price !== b.offer.price) return a.offer.price - b.offer.price;
      return a.distanceKm - b.distanceKm;
    }
    if (sortBy === 'closest') {
      if (a.distanceKm !== b.distanceKm) return a.distanceKm - b.distanceKm;
      return a.offer.price - b.offer.price;
    }
    if (sortBy === 'topRated') {
      if (a.shop.rating !== b.shop.rating) return b.shop.rating - a.shop.rating;
      return a.offer.price - b.offer.price;
    }
    return 0;
  });

  return results;
}
