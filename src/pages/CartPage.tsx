import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/cart';
import { useLangStore } from '../store/lang';
import { api } from '../api';
import { Shop, Product, Offer, CartItem } from '../types';
import { formatCurrency } from '../lib/format';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, Store, AlertCircle, Truck } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const CartPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { items, updateQty, removeItem, clearCart, getDistinctShopsCount } = useCartStore();
  const { language } = useLangStore();

  const [shops, setShops] = useState<Shop[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [allShops, allProds, allOffers] = await Promise.all([
          api.getShops(),
          api.getProducts(),
          api.getOffers(),
        ]);
        setShops(allShops);
        setProducts(allProds);
        setOffers(allOffers);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const distinctShopsCount = getDistinctShopsCount();

  // Group items by shop
  const groupedItems = items.reduce((acc: Record<string, CartItem[]>, item: CartItem) => {
    if (!acc[item.shopId]) acc[item.shopId] = [];
    acc[item.shopId].push(item);
    return acc;
  }, {} as Record<string, CartItem[]>);

  // Compute totals
  let subtotal = 0;
  items.forEach((item: CartItem) => {
    const offer = offers.find((o) => o.id === item.offerId);
    if (offer) {
      subtotal += offer.price * item.qty;
    }
  });

  // Base delivery fee (₹20 per shop for delivery)
  const deliveryFee = distinctShopsCount * 20;
  const totalAmount = subtotal + deliveryFee;

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-[#4E6057]">
        <p>Loading cart...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-[#EEF3EA] text-[#0E3B2C] flex items-center justify-center mx-auto">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h1 className="font-display font-bold text-2xl text-[#14201B]">
          {t('cart.emptyTitle')}
        </h1>
        <p className="text-sm text-[#4E6057]">
          {t('cart.emptySubtitle')}
        </p>
        <Link to="/">
          <Button variant="palm" size="lg" className="mt-2">
            {language === 'ta' ? 'பொருட்களைத் தேடுக' : 'Explore Pollachi Shops'}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display font-bold text-2xl sm:text-3xl text-[#14201B]">
          {t('cart.title')} ({items.length} {items.length === 1 ? 'item' : 'items'})
        </h1>
        <button
          onClick={clearCart}
          className="text-xs text-[#D63A2F] hover:underline font-semibold"
        >
          {language === 'ta' ? 'கார்ட்டை காலி செய்' : 'Clear Cart'}
        </button>
      </div>

      {/* Multi-Shop Split Warning Banner */}
      {distinctShopsCount > 1 && (
        <div className="bg-[#EEF3EA] border-2 border-[#1F6B4A]/30 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-[#1F6B4A] shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm text-[#14201B]">
            <p className="font-bold text-[#0E3B2C]">
              {language === 'ta'
                ? `உங்கள் கார்ட்டில் ${distinctShopsCount} வெவ்வேறு கடைகளின் பொருட்கள் உள்ளன.`
                : `Items in your cart belong to ${distinctShopsCount} different local shops.`}
            </p>
            <p className="text-[#4E6057] mt-0.5">
              {language === 'ta'
                ? 'ஒவ்வொரு கடையும் தனித்தனியாக பார்சல்களைத் தயாரித்து அனுப்பும்.'
                : 'Each shop prepares and dispatches its own parcel for fastest delivery.'}
            </p>
          </div>
        </div>
      )}

      {/* Grouped Items List */}
      <div className="space-y-6">
        {Object.entries(groupedItems).map(([shopId, shopCartItems]) => {
          const shop = shops.find((s) => s.id === shopId);
          let shopSubtotal = 0;

          return (
            <div
              key={shopId}
              className="bg-white rounded-2xl border border-[#DDE5D9] overflow-hidden shadow-xs"
            >
              {/* Shop Header */}
              <div className="bg-[#F7F9F4] px-5 py-3.5 border-b border-[#DDE5D9] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-[#0E3B2C]" />
                  <span className="font-display font-bold text-base text-[#14201B]">
                    {shop?.name || 'Local Shop'}
                  </span>
                  <span className="text-xs text-[#4E6057]">({shop?.area})</span>
                </div>
                <Badge variant="subtle" size="sm">
                  {shopCartItems.length} items
                </Badge>
              </div>

              {/* Items in this shop */}
              <div className="p-4 sm:p-5 divide-y divide-[#DDE5D9]">
                {shopCartItems.map((item: CartItem) => {
                  const product = products.find((p) => p.id === item.productId);
                  const offer = offers.find((o) => o.id === item.offerId);
                  const price = offer?.price || 0;
                  const itemTotal = price * item.qty;
                  shopSubtotal += itemTotal;

                  return (
                    <div
                      key={item.offerId}
                      className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={product?.image}
                          alt={product?.name}
                          className="w-14 h-14 rounded-xl object-cover border border-[#DDE5D9] bg-[#F7F9F4] shrink-0"
                        />
                        <div>
                          <h3 className="font-display font-bold text-sm sm:text-base text-[#14201B]">
                            {language === 'ta' ? product?.nameTa || product?.name : product?.name}
                          </h3>
                          <span className="text-xs text-[#4E6057]">{product?.unit}</span>
                          <span className="font-semibold text-xs text-[#0E3B2C] block sm:hidden">
                            {formatCurrency(price)} each
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="hidden sm:inline font-semibold text-sm text-[#0E3B2C]">
                          {formatCurrency(price)}
                        </span>

                        {/* Quantity Stepper */}
                        <div className="flex items-center gap-1.5 bg-[#F7F9F4] border border-[#BDCBB8] rounded-xl p-1">
                          <button
                            onClick={() => updateQty(item.offerId, item.qty - 1)}
                            className="w-7 h-7 rounded-lg bg-white border border-[#DDE5D9] hover:bg-[#EEF3EA] flex items-center justify-center text-[#14201B] font-bold"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-8 text-center font-bold text-sm text-[#14201B]">
                            {item.qty}
                          </span>
                          <button
                            onClick={() => updateQty(item.offerId, item.qty + 1)}
                            className="w-7 h-7 rounded-lg bg-white border border-[#DDE5D9] hover:bg-[#EEF3EA] flex items-center justify-center text-[#14201B] font-bold"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <span className="w-16 text-right font-display font-bold text-base text-[#14201B]">
                          {formatCurrency(itemTotal)}
                        </span>

                        <button
                          onClick={() => removeItem(item.offerId)}
                          className="p-1.5 text-[#4E6057] hover:text-[#D63A2F]"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Shop Subtotal footer */}
              <div className="bg-[#F7F9F4] px-5 py-2.5 border-t border-[#DDE5D9] flex justify-between text-xs text-[#4E6057]">
                <span>Shop Subtotal</span>
                <span className="font-bold text-[#14201B]">{formatCurrency(shopSubtotal)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bill Summary Card */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#DDE5D9] shadow-sm space-y-4">
        <h2 className="font-display font-bold text-lg text-[#14201B]">
          {language === 'ta' ? 'கட்டண விவரம்' : 'Order Summary'}
        </h2>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-[#4E6057]">
            <span>{t('cart.subtotal')}</span>
            <span className="font-semibold text-[#14201B]">{formatCurrency(subtotal)}</span>
          </div>

          <div className="flex justify-between text-[#4E6057]">
            <span className="flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-[#1F6B4A]" />
              {t('cart.deliveryFee')} ({distinctShopsCount} {distinctShopsCount === 1 ? 'shop' : 'shops'})
            </span>
            <span className="font-semibold text-[#14201B]">
              {formatCurrency(deliveryFee)}
            </span>
          </div>

          <div className="border-t border-[#DDE5D9] pt-3 flex justify-between items-baseline">
            <span className="font-bold text-base text-[#14201B]">{t('cart.total')}</span>
            <span className="font-display font-extrabold text-2xl text-[#0E3B2C]">
              {formatCurrency(totalAmount)}
            </span>
          </div>
        </div>

        <Button
          variant="marigold"
          size="lg"
          fullWidth
          onClick={() => navigate('/checkout')}
        >
          <span>{t('cart.checkoutBtn')}</span>
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};
