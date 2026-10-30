import { Offer, Shop, LocationCoords } from '../types';
import { calculateDistanceKm } from './haversine';
import { formatCurrency } from './format';

export interface BasketItem {
  productId: string;
  qty: number;
}

export interface SingleShopResult {
  shop: Shop;
  itemsTotal: number;
  deliveryFee: number;
  total: number;
  coveredItemCount: number;
  distanceKm: number;
}

export interface SplitShopResult {
  shopA: Shop;
  shopB: Shop;
  itemsTotal: number;
  deliveryFee: number;
  total: number;
  coveredItemCount: number;
  savingsVsSingle: number;
}

export interface OptimizedBasketResult {
  cheapestSingle: SingleShopResult | null;
  bestSplit: SplitShopResult | null;
  recommendation: 'single' | 'split';
  explanation: string;
}

/**
 * Pure function: Computes cheapest single store vs best split across two stores,
 * including delivery fees and plain-language explanation.
 */
export function optimizeBasket(
  list: BasketItem[],
  offers: Offer[],
  shops: Shop[],
  userCoords: LocationCoords,
  mode: 'delivery' | 'pickup' = 'delivery'
): OptimizedBasketResult {
  if (list.length === 0 || offers.length === 0 || shops.length === 0) {
    return {
      cheapestSingle: null,
      bestSplit: null,
      recommendation: 'single',
      explanation: 'Your basket list is empty.',
    };
  }

  const baseDeliveryPerShop = mode === 'delivery' ? 20 : 0;
  const shopMap = new Map<string, Shop>(shops.map((s) => [s.id, s]));

  // Index offers by [productId][shopId]
  const prodShopOffers: Record<string, Record<string, number>> = {};
  for (const off of offers) {
    if (!prodShopOffers[off.productId]) prodShopOffers[off.productId] = {};
    prodShopOffers[off.productId][off.shopId] = off.price;
  }

  // 1. Evaluate every single shop
  const singleResults: SingleShopResult[] = [];

  for (const shop of shops) {
    let itemsTotal = 0;
    let covered = 0;

    for (const item of list) {
      const price = prodShopOffers[item.productId]?.[shop.id];
      if (price !== undefined) {
        itemsTotal += price * item.qty;
        covered += 1;
      }
    }

    if (covered > 0) {
      const deliveryFee = baseDeliveryPerShop;
      const total = itemsTotal + deliveryFee;
      const dist = calculateDistanceKm(userCoords.lat, userCoords.lng, shop.lat, shop.lng);
      singleResults.push({
        shop,
        itemsTotal,
        deliveryFee,
        total,
        coveredItemCount: covered,
        distanceKm: dist,
      });
    }
  }

  // Sort by highest items covered first, then lowest total cost
  singleResults.sort((a, b) => {
    if (a.coveredItemCount !== b.coveredItemCount) {
      return b.coveredItemCount - a.coveredItemCount;
    }
    return a.total - b.total;
  });

  const cheapestSingle = singleResults[0] || null;

  // 2. Evaluate split across 2 shops (if more than 1 shop exists)
  let bestSplit: SplitShopResult | null = null;
  let minSplitTotal = Infinity;

  const validShops = singleResults.map((r) => r.shop);

  for (let i = 0; i < validShops.length; i++) {
    for (let j = i + 1; j < validShops.length; j++) {
      const shopA = validShops[i];
      const shopB = validShops[j];

      let splitItemsTotal = 0;
      let covered = 0;

      for (const item of list) {
        const priceA = prodShopOffers[item.productId]?.[shopA.id];
        const priceB = prodShopOffers[item.productId]?.[shopB.id];

        if (priceA !== undefined && priceB !== undefined) {
          splitItemsTotal += Math.min(priceA, priceB) * item.qty;
          covered += 1;
        } else if (priceA !== undefined) {
          splitItemsTotal += priceA * item.qty;
          covered += 1;
        } else if (priceB !== undefined) {
          splitItemsTotal += priceB * item.qty;
          covered += 1;
        }
      }

      if (covered === list.length) {
        const deliveryFee = baseDeliveryPerShop * 2;
        const total = splitItemsTotal + deliveryFee;

        if (total < minSplitTotal) {
          minSplitTotal = total;
          bestSplit = {
            shopA,
            shopB,
            itemsTotal: splitItemsTotal,
            deliveryFee,
            total,
            coveredItemCount: covered,
            savingsVsSingle: cheapestSingle ? cheapestSingle.total - total : 0,
          };
        }
      }
    }
  }

  // 3. Compare and formulate plain-word explanation
  let recommendation: 'single' | 'split' = 'single';
  let explanation = '';

  if (bestSplit && cheapestSingle && bestSplit.total < cheapestSingle.total) {
    recommendation = 'split';
    const diff = cheapestSingle.total - bestSplit.total;
    explanation = `Splitting across ${bestSplit.shopA.shortName} and ${bestSplit.shopB.shortName} saves ${formatCurrency(diff)}, but needs 2 ${mode === 'delivery' ? 'deliveries' : 'pickups'}.`;
  } else if (cheapestSingle) {
    recommendation = 'single';
    explanation = `Single shop (${cheapestSingle.shop.shortName}) is cheaper overall by avoiding duplicate delivery fees.`;
  } else {
    explanation = 'No nearby stores stock the selected items.';
  }

  return {
    cheapestSingle,
    bestSplit,
    recommendation,
    explanation,
  };
}
