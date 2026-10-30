/**
 * LocalKart v3 - Pure Business Logic Functions
 * Implements identical mathematical and algorithmic behavior to frontend for 100% parity.
 */

export interface Coords {
  lat: number;
  lng: number;
}

/**
 * Computes spherical distance between two points in METRES using the Haversine formula.
 */
export function haversine(a: Coords, b: Coords): number {
  if (a.lat === b.lat && a.lng === b.lng) return 0;

  const R = 6371e3; // Earth radius in metres
  const phi1 = (a.lat * Math.PI) / 180;
  const phi2 = (b.lat * Math.PI) / 180;
  const deltaPhi = ((b.lat - a.lat) * Math.PI) / 180;
  const deltaLambda = ((b.lng - a.lng) * Math.PI) / 180;

  const sinHalfPhi = Math.sin(deltaPhi / 2);
  const sinHalfLambda = Math.sin(deltaLambda / 2);

  const arc =
    sinHalfPhi * sinHalfPhi +
    Math.cos(phi1) * Math.cos(phi2) * sinHalfLambda * sinHalfLambda;
  const c = 2 * Math.atan2(Math.sqrt(arc), Math.sqrt(1 - arc));

  return Math.round(R * c);
}

export interface OfferComparisonInput {
  id: string;
  price: number; // in paise
  stock: number;
  shop: {
    id: string;
    name: string;
    lat: number;
    lng: number;
    rating: number;
    openNow: boolean;
    delivery: boolean;
    pickup: boolean;
  };
}

export interface ComparisonFilters {
  maxDistanceMetres?: number;
  minRating?: number;
  openNowOnly?: boolean;
  hasDeliveryOnly?: boolean;
  hasPickupOnly?: boolean;
  sortBy?: 'cheapest' | 'closest' | 'topRated';
}

export interface RankedOfferResult {
  offerId: string;
  shopId: string;
  shopName: string;
  price: number;
  stock: number;
  distanceMetres: number;
  rating: number;
  isCheapest: boolean;
  isClosest: boolean;
  isTopRated: boolean;
  reason: string;
}

/**
 * Filters, sorts, and ranks offers for a product.
 * Ties broken by distance, then rating.
 */
export function compareOffers(
  offers: OfferComparisonInput[],
  userLocation: Coords,
  filters: ComparisonFilters = {}
): RankedOfferResult[] {
  // Exclude out of stock
  let valid = offers.filter((o) => o.stock > 0);

  // Apply filters
  if (filters.openNowOnly) valid = valid.filter((o) => o.shop.openNow);
  if (filters.hasDeliveryOnly) valid = valid.filter((o) => o.shop.delivery);
  if (filters.hasPickupOnly) valid = valid.filter((o) => o.shop.pickup);
  if (filters.minRating) valid = valid.filter((o) => o.shop.rating >= filters.minRating!);

  const enriched = valid.map((o) => {
    const dist = haversine(userLocation, { lat: o.shop.lat, lng: o.shop.lng });
    return {
      offer: o,
      distanceMetres: dist,
    };
  });

  if (filters.maxDistanceMetres) {
    valid = enriched.filter((e) => e.distanceMetres <= filters.maxDistanceMetres!).map((e) => e.offer);
  }

  if (enriched.length === 0) return [];

  // Identify min price, min distance, max rating
  let minPrice = Infinity;
  let minDistance = Infinity;
  let maxRating = -1;

  for (const item of enriched) {
    if (item.offer.price < minPrice) minPrice = item.offer.price;
    if (item.distanceMetres < minDistance) minDistance = item.distanceMetres;
    if (item.offer.shop.rating > maxRating) maxRating = item.offer.shop.rating;
  }

  // Sort
  const sortBy = filters.sortBy || 'cheapest';
  enriched.sort((a, b) => {
    if (sortBy === 'cheapest') {
      if (a.offer.price !== b.offer.price) return a.offer.price - b.offer.price;
      if (a.distanceMetres !== b.distanceMetres) return a.distanceMetres - b.distanceMetres;
      return b.offer.shop.rating - a.offer.shop.rating;
    } else if (sortBy === 'closest') {
      if (a.distanceMetres !== b.distanceMetres) return a.distanceMetres - b.distanceMetres;
      if (a.offer.price !== b.offer.price) return a.offer.price - b.offer.price;
      return b.offer.shop.rating - a.offer.shop.rating;
    } else {
      if (b.offer.shop.rating !== a.offer.shop.rating) return b.offer.shop.rating - a.offer.shop.rating;
      if (a.offer.price !== b.offer.price) return a.offer.price - b.offer.price;
      return a.distanceMetres - b.distanceMetres;
    }
  });

  return enriched.map((item) => {
    const isCheapest = item.offer.price === minPrice;
    const isClosest = item.distanceMetres === minDistance;
    const isTopRated = item.offer.shop.rating === maxRating;

    let reason = 'Available nearby';
    if (isCheapest && isClosest) reason = 'Cheapest and closest shop in Pollachi';
    else if (isCheapest) reason = 'Lowest price in town';
    else if (isClosest) reason = 'Closest walking distance';
    else if (isTopRated) reason = 'Highest rated customer choice';

    return {
      offerId: item.offer.id,
      shopId: item.offer.shop.id,
      shopName: item.offer.shop.name,
      price: item.offer.price,
      stock: item.offer.stock,
      distanceMetres: item.distanceMetres,
      rating: item.offer.shop.rating,
      isCheapest,
      isClosest,
      isTopRated,
      reason,
    };
  });
}

export interface BasketItemInput {
  productId: string;
  qty: number;
}

export interface StoreOfferItem {
  productId: string;
  shopId: string;
  shopName: string;
  price: number; // in paise
}

export interface OptimizedBasketResult {
  bestSingle: {
    shopId: string;
    shopName: string;
    itemsTotal: number;
    deliveryFee: number;
    grandTotal: number;
  } | null;
  bestSplit: {
    shopA: { shopId: string; shopName: string };
    shopB: { shopId: string; shopName: string };
    itemsTotal: number;
    deliveryFee: number;
    grandTotal: number;
    savingsVsSingle: number;
  } | null;
  recommendation: 'single' | 'split';
  explanation: string;
}

/**
 * Optimizes basket across single store vs split across at most 2 stores,
 * with delivery fee and multi-pickup considerations.
 */
export function optimizeBasket(
  list: BasketItemInput[],
  offers: StoreOfferItem[],
  baseDeliveryFee = 2000 // 2000 paise = ₹20
): OptimizedBasketResult {
  if (list.length === 0 || offers.length === 0) {
    return {
      bestSingle: null,
      bestSplit: null,
      recommendation: 'single',
      explanation: 'Empty shopping list.',
    };
  }

  // Index offers: [productId][shopId] -> price
  const prodShopMap: Record<string, Record<string, { price: number; shopName: string }>> = {};
  const allShopIds = new Set<string>();

  for (const o of offers) {
    if (!prodShopMap[o.productId]) prodShopMap[o.productId] = {};
    prodShopMap[o.productId][o.shopId] = { price: o.price, shopName: o.shopName };
    allShopIds.add(o.shopId);
  }

  // 1. Single Shop Candidates
  let bestSingle: OptimizedBasketResult['bestSingle'] = null;
  let minSingleTotal = Infinity;

  for (const sId of allShopIds) {
    let itemsTotal = 0;
    let covered = 0;
    let sName = '';

    for (const item of list) {
      const match = prodShopMap[item.productId]?.[sId];
      if (match) {
        itemsTotal += match.price * item.qty;
        covered += 1;
        sName = match.shopName;
      }
    }

    if (covered === list.length) {
      const grandTotal = itemsTotal + baseDeliveryFee;
      if (grandTotal < minSingleTotal) {
        minSingleTotal = grandTotal;
        bestSingle = {
          shopId: sId,
          shopName: sName,
          itemsTotal,
          deliveryFee: baseDeliveryFee,
          grandTotal,
        };
      }
    }
  }

  // 2. Best Split Across 2 Shops
  const shopIdList = Array.from(allShopIds);
  let bestSplit: OptimizedBasketResult['bestSplit'] = null;
  let minSplitTotal = Infinity;

  for (let i = 0; i < shopIdList.length; i++) {
    for (let j = i + 1; j < shopIdList.length; j++) {
      const idA = shopIdList[i];
      const idB = shopIdList[j];
      let itemsTotal = 0;
      let covered = 0;
      let nameA = '';
      let nameB = '';

      for (const item of list) {
        const offA = prodShopMap[item.productId]?.[idA];
        const offB = prodShopMap[item.productId]?.[idB];

        if (offA && offB) {
          itemsTotal += Math.min(offA.price, offB.price) * item.qty;
          covered += 1;
          nameA = offA.shopName;
          nameB = offB.shopName;
        } else if (offA) {
          itemsTotal += offA.price * item.qty;
          covered += 1;
          nameA = offA.shopName;
        } else if (offB) {
          itemsTotal += offB.price * item.qty;
          covered += 1;
          nameB = offB.shopName;
        }
      }

      if (covered === list.length) {
        // Two delivery fees (or pickup penalty)
        const splitDeliveryFee = baseDeliveryFee * 2;
        const grandTotal = itemsTotal + splitDeliveryFee;

        if (grandTotal < minSplitTotal) {
          minSplitTotal = grandTotal;
          bestSplit = {
            shopA: { shopId: idA, shopName: nameA },
            shopB: { shopId: idB, shopName: nameB },
            itemsTotal,
            deliveryFee: splitDeliveryFee,
            grandTotal,
            savingsVsSingle: bestSingle ? bestSingle.grandTotal - grandTotal : 0,
          };
        }
      }
    }
  }

  let recommendation: 'single' | 'split' = 'single';
  let explanation = '';

  if (bestSplit && bestSingle && bestSplit.grandTotal < bestSingle.grandTotal) {
    recommendation = 'split';
    const diffRupees = ((bestSingle.grandTotal - bestSplit.grandTotal) / 100).toFixed(0);
    explanation = `Split across ${bestSplit.shopA.shopName} and ${bestSplit.shopB.shopName} saves ₹${diffRupees}, but needs 2 pickups.`;
  } else if (bestSingle) {
    recommendation = 'single';
    explanation = `Single shop (${bestSingle.shopName}) is cheaper overall by avoiding duplicate delivery fees.`;
  } else {
    explanation = 'No combination of nearby shops carries all requested items.';
  }

  return {
    bestSingle,
    bestSplit,
    recommendation,
    explanation,
  };
}

export interface PnlSummary {
  revenue: number; // paise
  cogs: number; // cost of goods sold in paise
  grossMargin: number; // percentage e.g. 24.5
  totalExpenses: number; // paise
  netProfit: number; // paise
  expensesByCategory: Record<string, number>;
}

/**
 * Calculates financial P&L summary from sales, expenses, and movements.
 */
export function calcPnl(
  salesPaise: number,
  expenses: { amount: number; category: string }[],
  estimatedCogsRatio = 0.76 // 76% average COGS in grocery retail
): PnlSummary {
  const cogs = Math.round(salesPaise * estimatedCogsRatio);
  const grossProfit = salesPaise - cogs;
  const grossMargin = salesPaise > 0 ? (grossProfit / salesPaise) * 100 : 0;

  const expensesByCategory: Record<string, number> = {};
  let totalExpenses = 0;

  for (const exp of expenses) {
    totalExpenses += exp.amount;
    expensesByCategory[exp.category] = (expensesByCategory[exp.category] || 0) + exp.amount;
  }

  const netProfit = grossProfit - totalExpenses;

  return {
    revenue: salesPaise,
    cogs,
    grossMargin: Math.round(grossMargin * 10) / 10,
    totalExpenses,
    netProfit,
    expensesByCategory,
  };
}

export interface DayCloseResult {
  expectedCash: number;
  countedCash: number;
  difference: number;
  status: 'matched' | 'short' | 'over';
}

/**
 * Reconciles day closing expected cash against counted cash in drawer.
 */
export function closeDay(expectedCash: number, countedCash: number): DayCloseResult {
  const difference = countedCash - expectedCash;
  let status: 'matched' | 'short' | 'over' = 'matched';
  if (difference < 0) status = 'short';
  else if (difference > 0) status = 'over';

  return {
    expectedCash,
    countedCash,
    difference,
    status,
  };
}

/**
 * Classifies inventory shelf expiry status into 3 distinct operational buckets.
 */
export function classifyExpiry(
  expiryDateStr: string | Date | null | undefined,
  today: Date = new Date()
): 'ok' | 'expiring' | 'expired' {
  if (!expiryDateStr) return 'ok';
  const exp = new Date(expiryDateStr);
  const diffTime = exp.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'expired';
  if (diffDays <= 7) return 'expiring';
  return 'ok';
}

/**
 * Classifies store crowd footfall into quiet, moderate, or busy.
 */
export function classifyCrowd(
  peopleNow: number,
  capacityHint = 100
): 'quiet' | 'moderate' | 'busy' {
  const ratio = peopleNow / capacityHint;
  if (ratio > 0.6 || peopleNow >= 60) return 'busy';
  if (ratio >= 0.25 || peopleNow >= 25) return 'moderate';
  return 'quiet';
}

/**
 * Calculates neighbourhood group delivery fee based on member count.
 * Per-person fee falls as members join, with a safety floor of ₹5 (500 paise).
 */
export function groupFee(baseFeePaise: number, joined: number, target = 5): number {
  const floorFee = 500; // ₹5.00
  if (joined <= 1) return baseFeePaise;
  const scaled = Math.round(baseFeePaise / joined);
  return Math.min(baseFeePaise, Math.max(floorFee, scaled));
}

/**
 * Formats stock confidence label key and evaluates staleness (> 24 hours).
 */
export function stockConfidence(
  source: 'owner' | 'camera' | string,
  updatedAt: Date | string,
  now: Date = new Date()
): { label: string; stale: boolean } {
  const upd = new Date(updatedAt);
  const ageHours = (now.getTime() - upd.getTime()) / (1000 * 60 * 60);
  const stale = ageHours >= 24;

  let label = source === 'camera' ? 'Live from shelf camera' : 'Updated by merchant';
  if (ageHours < 1) {
    label += `, ${Math.max(1, Math.round(ageHours * 60))} min ago`;
  } else {
    label += `, ${Math.round(ageHours)} h ago`;
  }

  return { label, stale };
}
