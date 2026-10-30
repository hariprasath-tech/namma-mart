import React, { useState, useEffect } from 'react';
import { Product, Offer, Shop } from '../../types';
import { api } from '../../api';
import { useLocationStore } from '../../store/location';
import { useCartStore } from '../../store/cart';
import { optimizeBasket, BasketItem } from '../../lib/optimizeBasket';
import { formatCurrency } from '../../lib/format';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  Sparkles,
  ShoppingBag,
  Store,
  Truck,
  CheckCircle2,
  X,
  ArrowRight,
  TrendingDown,
  Info,
  Check,
} from 'lucide-react';

interface SmartBasketModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SmartBasketModal: React.FC<SmartBasketModalProps> = ({ isOpen, onClose }) => {
  const { userCoords } = useLocationStore();
  const { addItem, clearCart } = useCartStore();

  const [products, setProducts] = useState<Product[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected items with quantity
  const [basket, setBasket] = useState<BasketItem[]>([
    { productId: 'prod-1', qty: 2 }, // Ponni Rice
    { productId: 'prod-2', qty: 1 }, // Coconut Oil
    { productId: 'prod-3', qty: 1 }, // Toor Dal
  ]);
  const [fulfillmentMode, setFulfillmentMode] = useState<'delivery' | 'pickup'>('delivery');
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const loadData = async () => {
      setLoading(true);
      try {
        const [allProds, allOffers, allShops] = await Promise.all([
          api.getProducts(),
          api.getOffers(),
          api.getShops(),
        ]);
        setProducts(allProds);
        setOffers(allOffers);
        setShops(allShops);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleProductInBasket = (prodId: string) => {
    setBasket((prev) => {
      const exists = prev.find((b) => b.productId === prodId);
      if (exists) {
        return prev.filter((b) => b.productId !== prodId);
      }
      return [...prev, { productId: prodId, qty: 1 }];
    });
  };

  const updateBasketQty = (prodId: string, delta: number) => {
    setBasket((prev) =>
      prev
        .map((b) => (b.productId === prodId ? { ...b, qty: Math.max(1, b.qty + delta) } : b))
        .filter((b) => b.qty > 0)
    );
  };

  const optimization = optimizeBasket(basket, offers, shops, userCoords, fulfillmentMode);

  const handleApplyWinningBasket = () => {
    clearCart();
    // If single, add all from single shop
    if (optimization.recommendation === 'single' && optimization.cheapestSingle) {
      const shopId = optimization.cheapestSingle.shop.id;
      for (const item of basket) {
        const matchedOffer = offers.find(
          (o) => o.productId === item.productId && o.shopId === shopId
        );
        if (matchedOffer) {
          addItem(matchedOffer.id, item.productId, shopId, item.qty);
        }
      }
    } else if (optimization.bestSplit) {
      // Split mode
      for (const item of basket) {
        const offerA = offers.find(
          (o) => o.productId === item.productId && o.shopId === optimization.bestSplit?.shopA.id
        );
        const offerB = offers.find(
          (o) => o.productId === item.productId && o.shopId === optimization.bestSplit?.shopB.id
        );

        let chosenOffer = offerA;
        if (offerB && (!offerA || offerB.price < offerA.price)) {
          chosenOffer = offerB;
        }
        if (chosenOffer) {
          addItem(chosenOffer.id, item.productId, chosenOffer.shopId, item.qty);
        }
      }
    }

    setApplied(true);
    setTimeout(() => {
      setApplied(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-[#DDE5D9] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#0E3B2C] text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-[#FFB400]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg">Smart Basket Optimizer</h2>
              <p className="text-xs text-white/80">
                Single shop vs Split 2-shop algorithmic cost optimizer.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-white/80 hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto">
          {/* Mode switch: Delivery vs Pickup */}
          <div className="flex items-center justify-between bg-[#F7F9F4] p-3 rounded-xl border border-[#DDE5D9]">
            <span className="text-xs font-bold text-[#14201B] uppercase tracking-wider">
              Fulfillment Type
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFulfillmentMode('delivery')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  fulfillmentMode === 'delivery'
                    ? 'bg-[#0E3B2C] text-[#FFB400]'
                    : 'bg-white text-[#4E6057] border border-[#BDCBB8]'
                }`}
              >
                <Truck className="w-3.5 h-3.5" />
                <span>Home Delivery (₹20/shop)</span>
              </button>
              <button
                onClick={() => setFulfillmentMode('pickup')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  fulfillmentMode === 'pickup'
                    ? 'bg-[#0E3B2C] text-[#FFB400]'
                    : 'bg-white text-[#4E6057] border border-[#BDCBB8]'
                }`}
              >
                <Store className="w-3.5 h-3.5" />
                <span>Store Pickup (₹0 fee)</span>
              </button>
            </div>
          </div>

          {/* Quick Item Picker */}
          <div>
            <span className="text-xs font-bold uppercase text-[#4E6057] block mb-2">
              Select Groceries to Optimize ({basket.length} selected)
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {products.slice(0, 6).map((prod) => {
                const inBasket = basket.find((b) => b.productId === prod.id);
                return (
                  <div
                    key={prod.id}
                    onClick={() => toggleProductInBasket(prod.id)}
                    className={`p-2 rounded-xl border text-xs cursor-pointer flex items-center justify-between transition-all ${
                      inBasket
                        ? 'bg-[#EEF3EA] border-[#1F6B4A] text-[#0E3B2C] font-semibold'
                        : 'bg-[#F7F9F4] border-[#DDE5D9] text-[#4E6057]'
                    }`}
                  >
                    <span className="truncate">{prod.name}</span>
                    {inBasket ? (
                      <Check className="w-4 h-4 text-[#1F6B4A] shrink-0" />
                    ) : (
                      <span className="text-[10px] text-[#4E6057] shrink-0">+ Add</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Side-by-Side Comparison: Single Shop vs Split Shop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Column 1: Cheapest Single Shop */}
            <div
              className={`rounded-2xl p-4 border-2 transition-all space-y-3 ${
                optimization.recommendation === 'single'
                  ? 'border-[#FFB400] bg-[#FFFBEB]/60 shadow-sm'
                  : 'border-[#DDE5D9] bg-white opacity-85'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-[#4E6057] block">
                  Option A: Single Shop
                </span>
                {optimization.recommendation === 'single' && (
                  <Badge variant="marigold" size="sm" className="font-bold">
                    ★ Best Overall
                  </Badge>
                )}
              </div>

              {optimization.cheapestSingle ? (
                <>
                  <div>
                    <h4 className="font-display font-extrabold text-lg text-[#14201B]">
                      {optimization.cheapestSingle.shop.name}
                    </h4>
                    <span className="text-xs text-[#4E6057]">
                      {optimization.cheapestSingle.shop.area} · 1 trip / delivery
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-[#4E6057] pt-2 border-t border-[#DDE5D9]">
                    <div className="flex justify-between">
                      <span>Items subtotal:</span>
                      <span className="font-semibold text-[#14201B]">
                        {formatCurrency(optimization.cheapestSingle.itemsTotal)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Delivery fee:</span>
                      <span className="font-semibold text-[#14201B]">
                        {formatCurrency(optimization.cheapestSingle.deliveryFee)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm font-extrabold text-[#0E3B2C] pt-1 border-t border-[#DDE5D9]">
                      <span>Grand Total:</span>
                      <span>{formatCurrency(optimization.cheapestSingle.total)}</span>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-xs text-[#4E6057] py-4">No single shop carries all items.</p>
              )}
            </div>

            {/* Column 2: Best Split Across 2 Shops */}
            <div
              className={`rounded-2xl p-4 border-2 transition-all space-y-3 ${
                optimization.recommendation === 'split'
                  ? 'border-[#FFB400] bg-[#FFFBEB]/60 shadow-sm'
                  : 'border-[#DDE5D9] bg-white opacity-85'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-[#4E6057] block">
                  Option B: Split 2 Shops
                </span>
                {optimization.recommendation === 'split' && (
                  <Badge variant="marigold" size="sm" className="font-bold">
                    ★ Maximum Savings
                  </Badge>
                )}
              </div>

              {optimization.bestSplit ? (
                <>
                  <div>
                    <h4 className="font-display font-extrabold text-base text-[#14201B]">
                      {optimization.bestSplit.shopA.shortName} + {optimization.bestSplit.shopB.shortName}
                    </h4>
                    <span className="text-xs text-[#4E6057]">
                      2 {fulfillmentMode === 'delivery' ? 'deliveries' : 'pickups'}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-[#4E6057] pt-2 border-t border-[#DDE5D9]">
                    <div className="flex justify-between">
                      <span>Items subtotal:</span>
                      <span className="font-semibold text-[#14201B]">
                        {formatCurrency(optimization.bestSplit.itemsTotal)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Delivery fees (2x):</span>
                      <span className="font-semibold text-[#14201B]">
                        {formatCurrency(optimization.bestSplit.deliveryFee)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm font-extrabold text-[#0E3B2C] pt-1 border-t border-[#DDE5D9]">
                      <span>Grand Total:</span>
                      <span>{formatCurrency(optimization.bestSplit.total)}</span>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-xs text-[#4E6057] py-4">Split pricing not beneficial.</p>
              )}
            </div>
          </div>

          {/* Plain-Word Explanation Card */}
          <div className="p-4 rounded-xl bg-[#EEF3EA] border border-[#BDCBB8] flex items-start gap-2.5 text-xs text-[#0E3B2C]">
            <Info className="w-4 h-4 text-[#1F6B4A] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Recommendation:</p>
              <p className="text-[#4E6057] mt-0.5 leading-relaxed">{optimization.explanation}</p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-[#F7F9F4] border-t border-[#DDE5D9] flex items-center justify-between gap-3 shrink-0">
          <button
            onClick={onClose}
            className="text-xs font-semibold text-[#4E6057] hover:underline"
          >
            Close
          </button>

          <Button
            variant="marigold"
            size="md"
            onClick={handleApplyWinningBasket}
            className="font-bold text-xs"
          >
            {applied ? (
              <span className="flex items-center gap-1.5 text-[#14201B]">
                <CheckCircle2 className="w-4 h-4 text-[#1F6B4A]" /> Cart Updated!
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4" />
                <span>Apply Recommended Basket to Cart</span>
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
