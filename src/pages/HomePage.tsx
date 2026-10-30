import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { Shop, Product, Offer } from '../types';
import { useLocationStore } from '../store/location';
import { useCartStore } from '../store/cart';
import { useLangStore } from '../store/lang';
import { NearbyMapHero } from '../components/map/NearbyMapHero';
import { formatCurrency } from '../lib/format';
import { calculateDistanceKm, formatDistance } from '../lib/haversine';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { SmartBasketModal } from '../components/customer/SmartBasketModal';
import { AskShopsModal } from '../components/customer/AskShopsModal';
import { MonthlyListModal } from '../components/customer/MonthlyListModal';
import { GroupOrderCard } from '../components/customer/GroupOrderCard';
import {
  Star,
  Store,
  ArrowRight,
  TrendingUp,
  ShoppingBag,
  Sparkles,
  GitCompare,
  Clock,
  Layers,
  MessageSquare,
  Calendar,
  Truck,
  ShieldCheck,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const HomePage: React.FC = () => {
  const { t } = useTranslation();
  const { userCoords, selectedTown } = useLocationStore();
  const { addItem } = useCartStore();
  const { language } = useLangStore();

  const [shops, setShops] = useState<Shop[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [addedOfferId, setAddedOfferId] = useState<string | null>(null);

  // Modals state for v2 customer features
  const [showSmartBasket, setShowSmartBasket] = useState(false);
  const [showAskShops, setShowAskShops] = useState(false);
  const [showMonthlyList, setShowMonthlyList] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [s, p, o] = await Promise.all([
          api.getShops(),
          api.getProducts(),
          api.getOffers(),
        ]);
        setShops(s);
        setProducts(p);
        setOffers(o);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAddToCart = (offerId: string, productId: string, shopId: string) => {
    addItem(offerId, productId, shopId, 1);
    setAddedOfferId(offerId);
    setTimeout(() => setAddedOfferId(null), 1500);
  };

  // Find 4 standout "Cheapest near you" deals
  const cheapestDeals = [
    { prodId: 'prod-1', offerId: 'off-3', shopId: 'shop-3' }, // Ponni Rice ₹48 at Mahalingam Mandi
    { prodId: 'prod-2', offerId: 'off-6', shopId: 'shop-14' }, // Coconut Oil ₹210 at Kovai Mill
    { prodId: 'prod-11', offerId: 'off-35', shopId: 'shop-6' }, // 9W LED Bulb ₹89 at Sakthi Electricals
    { prodId: 'prod-17', offerId: 'off-49', shopId: 'shop-13' }, // Classmate notebook ₹55 at Saraswathi Mart
  ].map((d) => {
    const product = products.find((p) => p.id === d.prodId);
    const offer = offers.find((o) => o.id === d.offerId);
    const shop = shops.find((s) => s.id === d.shopId);
    const distanceKm = shop
      ? calculateDistanceKm(userCoords.lat, userCoords.lng, shop.lat, shop.lng)
      : 1.0;
    return { product, offer, shop, distanceKm };
  }).filter((d) => d.product && d.offer && d.shop);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-8 sm:space-y-10">
      {/* 1. The Memorable Moment: The Nearby Map Hero */}
      <section aria-label="Nearby Map Hero">
        <NearbyMapHero
          shops={shops}
          products={products}
          offers={offers}
          initialSearch="rice"
        />
      </section>

      {/* 2. Customer v2 Action Hub: Smart Basket | Ask Nearby Shops | Monthly Groceries */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div
          onClick={() => setShowSmartBasket(true)}
          className="p-4 rounded-2xl bg-white border border-[#DDE5D9] hover:border-[#FFB400] transition-all cursor-pointer shadow-xs group flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFFBEB] text-[#FFB400] flex items-center justify-center shrink-0 border border-[#FFB400]/40 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-[#854D0E]" />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm text-[#14201B]">
                Smart Basket
              </h3>
              <p className="text-[11px] text-[#4E6057]">
                Optimize 1 store vs split 2 stores
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-[#4E6057] group-hover:translate-x-1 transition-transform" />
        </div>

        <div
          onClick={() => setShowAskShops(true)}
          className="p-4 rounded-2xl bg-white border border-[#DDE5D9] hover:border-[#0E3B2C] transition-all cursor-pointer shadow-xs group flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EEF3EA] text-[#0E3B2C] flex items-center justify-center shrink-0 border border-[#BDCBB8] group-hover:scale-105 transition-transform">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm text-[#14201B]">
                Can't Find It?
              </h3>
              <p className="text-[11px] text-[#4E6057]">
                Ask 14+ Pollachi shops for price
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-[#4E6057] group-hover:translate-x-1 transition-transform" />
        </div>

        <div
          onClick={() => setShowMonthlyList(true)}
          className="p-4 rounded-2xl bg-white border border-[#DDE5D9] hover:border-[#1F6B4A] transition-all cursor-pointer shadow-xs group flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F7F9F4] text-[#1F6B4A] flex items-center justify-center shrink-0 border border-[#DDE5D9] group-hover:scale-105 transition-transform">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm text-[#14201B]">
                Monthly Groceries
              </h3>
              <p className="text-[11px] text-[#4E6057]">
                1-tap rebuild from cheapest shops
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-[#4E6057] group-hover:translate-x-1 transition-transform" />
        </div>
      </section>

      {/* 3. Neighbourhood Group Delivery Fee Splitting Widget */}
      <section>
        <GroupOrderCard />
      </section>

      {/* 4. "Cheapest near you" Curated Comparison Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FFB400] inline-block animate-ping"></span>
              <h2 className="font-display font-bold text-xl sm:text-2xl text-[#14201B]">
                {t('home.cheapestNearYou')}
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[#4E6057]">
              {language === 'ta'
                ? 'பொள்ளாச்சி கடைகளில் குறைந்த விலையில் கிடைக்கும் அன்றாட பொருட்கள்'
                : 'Verified lowest local prices across Pollachi town stores'}
            </p>
          </div>

          <Link
            to="/search"
            className="text-xs sm:text-sm font-bold text-[#0E3B2C] hover:underline flex items-center gap-1"
          >
            <span>{t('home.viewAll')}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cheapestDeals.map(({ product, offer, shop, distanceKm }) => {
            if (!product || !offer || !shop) return null;

            return (
              <div
                key={product.id}
                className="bg-white rounded-2xl p-4 border border-[#DDE5D9] shadow-xs flex flex-col justify-between hover:border-[#FFB400] transition-all group"
              >
                <div>
                  <div className="relative mb-3 rounded-xl overflow-hidden bg-[#F7F9F4] h-36">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 left-2">
                      <Badge variant="marigold" size="sm">
                        ★ {t('compare.cheapestBadge')}
                      </Badge>
                    </div>
                  </div>

                  <h3 className="font-display font-bold text-base text-[#14201B] line-clamp-1">
                    {language === 'ta' ? product.nameTa || product.name : product.name}
                  </h3>
                  <span className="text-xs text-[#4E6057] block">{product.unit}</span>

                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="font-display font-extrabold text-2xl text-[#0E3B2C]">
                      {formatCurrency(offer.price)}
                    </span>
                    {offer.mrp && offer.mrp > offer.price && (
                      <span className="text-xs text-[#4E6057] line-through">
                        {formatCurrency(offer.mrp)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-[#4E6057] pt-2 mt-2 border-t border-[#DDE5D9]">
                    <span className="truncate max-w-[120px] font-medium text-[#14201B]">
                      {shop.name}
                    </span>
                    <span>{formatDistance(distanceKm)}</span>
                  </div>
                </div>

                <div className="pt-3 space-y-2">
                  <Button
                    variant="marigold"
                    size="sm"
                    fullWidth
                    onClick={() => handleAddToCart(offer.id, product.id, shop.id)}
                  >
                    <ShoppingBag className="w-3.5 h-3.5 mr-1.5" />
                    <span>
                      {addedOfferId === offer.id ? t('common.added') : t('common.addToCart')}
                    </span>
                  </Button>

                  <Link
                    to={`/compare?productId=${product.id}`}
                    className="w-full flex items-center justify-center text-[11px] font-bold text-[#0E3B2C] hover:underline pt-0.5"
                  >
                    <span>{language === 'ta' ? 'கடைகளை ஒப்பிடவும்' : 'Compare shops'}</span>
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. "Popular Pollachi Shops" Section with Verified Badges & Crowd Levels */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display font-bold text-xl sm:text-2xl text-[#14201B]">
              {t('home.popularShops')}
            </h2>
            <p className="text-xs sm:text-sm text-[#4E6057]">
              {language === 'ta'
                ? 'பொள்ளாச்சியின் பாரம்பரியமான மற்றும் நம்பிக்கையான அங்காடிகள்'
                : 'Trusted neighborhood merchants in Pollachi'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {shops.slice(0, 6).map((shop) => {
            const dist = calculateDistanceKm(userCoords.lat, userCoords.lng, shop.lat, shop.lng);

            return (
              <div
                key={shop.id}
                className="bg-white rounded-2xl p-5 border border-[#DDE5D9] shadow-xs flex flex-col justify-between hover:border-[#0E3B2C] transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-display font-bold text-lg text-[#14201B] line-clamp-1">
                          {language === 'ta' ? shop.nameTa || shop.name : shop.name}
                        </h3>
                        {shop.verified && (
                          <span title="Verified Merchant" className="text-[#1F6B4A]">
                            ✓
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#4E6057] line-clamp-1">{shop.address}</p>
                    </div>
                    <Badge variant={shop.openNow ? 'grove' : 'subtle'} size="sm">
                      {shop.openNow ? 'Open' : 'Closed'}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-[#4E6057] my-3">
                    <span className="flex items-center gap-1 font-bold text-[#14201B]">
                      <Star className="w-3.5 h-3.5 fill-[#FFB400] text-[#FFB400]" />
                      {shop.rating} ({shop.reviewCount})
                    </span>
                    <span>•</span>
                    <span className="font-semibold text-[#0E3B2C]">
                      {formatDistance(dist)} away
                    </span>
                    <span>•</span>
                    <span>{shop.hours}</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {shop.categories.map((c: string) => (
                      <span
                        key={c}
                        className="text-[11px] px-2 py-0.5 rounded-full bg-[#EEF3EA] text-[#0E3B2C] font-medium"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>

                <Link to={`/shop/${shop.id}`}>
                  <Button variant="outline" size="sm" fullWidth>
                    <Store className="w-4 h-4 mr-1.5 text-[#0E3B2C]" />
                    <span>{language === 'ta' ? 'கடைக்குச் செல்ல' : 'Visit Shop'}</span>
                  </Button>
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. Compare Any Product Callout Banner */}
      <section className="bg-[#0E3B2C] text-white rounded-2xl p-6 sm:p-8 border border-[#1F6B4A] flex flex-col md:flex-row items-center justify-between gap-6 shadow-md">
        <div className="space-y-2 text-center md:text-left">
          <Badge variant="marigold" size="sm">
            10-Second Decision Tool
          </Badge>
          <h2 className="font-display font-bold text-2xl sm:text-3xl text-white">
            {language === 'ta'
              ? 'எந்த கடையிலும் வாங்கும் முன் ஒப்பிட்டுப் பாருங்கள்'
              : 'Compare any item across Pollachi stores'}
          </h2>
          <p className="text-xs sm:text-sm text-white/80 max-w-xl">
            See price, distance, rating, and stock side-by-side with instant cheapest & closest tags. No walking shop to shop.
          </p>
        </div>

        <Link to="/compare" className="shrink-0">
          <Button variant="marigold" size="lg" className="flex items-center gap-2">
            <GitCompare className="w-5 h-5" />
            <span>{language === 'ta' ? 'நேரடி ஒப்பீடு' : 'Launch Compare Engine'}</span>
          </Button>
        </Link>
      </section>

      {/* Modals for v2 Features */}
      {showSmartBasket && (
        <SmartBasketModal
          isOpen={true}
          onClose={() => setShowSmartBasket(false)}
        />
      )}

      {showAskShops && (
        <AskShopsModal
          isOpen={true}
          onClose={() => setShowAskShops(false)}
        />
      )}

      {showMonthlyList && (
        <MonthlyListModal
          isOpen={true}
          onClose={() => setShowMonthlyList(false)}
        />
      )}
    </div>
  );
};
