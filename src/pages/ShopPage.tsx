import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';
import { Shop, Product, Offer, Review } from '../types';
import { CrowdSnapshot } from '../types/ml';
import { activeMLService as mockMLService } from '../ml-sim/httpMLService';
import { useCartStore } from '../store/cart';
import { useLocationStore } from '../store/location';
import { useLangStore } from '../store/lang';
import { useSimpleModeStore } from '../store/simpleMode';
import { formatCurrency } from '../lib/format';
import { calculateDistanceKm, formatDistance } from '../lib/haversine';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ReserveModal } from '../components/customer/ReserveModal';
import {
  Store,
  MapPin,
  Phone,
  Clock,
  Star,
  Truck,
  ShoppingBag,
  Navigation,
  ArrowLeft,
  Users,
  CheckCircle2,
  Bell,
  BellRing,
  ShieldCheck,
  Sparkles,
  Camera,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';

export const ShopPage: React.FC = () => {
  const { t } = useTranslation();
  const { shopId } = useParams<{ shopId: string }>();
  const { userCoords } = useLocationStore();
  const { addItem } = useCartStore();
  const { language } = useLangStore();
  const { isSimpleMode } = useSimpleModeStore();

  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [crowd, setCrowd] = useState<CrowdSnapshot | null>(null);
  const [hourlyFootfall, setHourlyFootfall] = useState<{ hour: number; label: string; people: number }[]>([]);
  const [loading, setLoading] = useState(true);

  // Reserve modal state
  const [reserveOffer, setReserveOffer] = useState<{ offer: Offer; product: Product } | null>(null);

  // Price watch state
  const [watchedOffers, setWatchedOffers] = useState<Record<string, boolean>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [newReviewText, setNewReviewText] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [addedOfferId, setAddedOfferId] = useState<string | null>(null);

  const currentHour = new Date().getHours();

  useEffect(() => {
    const loadShopData = async () => {
      if (!shopId) return;
      try {
        const [allShops, allProds, allOffers, allRevs, crowdSnap, footfallCurve] = await Promise.all([
          api.getShops(),
          api.getProducts(),
          api.getOffers(undefined, shopId),
          api.getReviews(shopId),
          mockMLService.getCrowd(shopId),
          mockMLService.getFootfallByHour(shopId, new Date().toISOString()),
        ]);

        const matchedShop = allShops.find((s: Shop) => s.id === shopId) || allShops[0];
        setShop(matchedShop);
        setProducts(allProds);
        setOffers(allOffers);
        setReviews(allRevs);
        setCrowd(crowdSnap);

        // Format 24-hour bars (6 AM to 10 PM)
        const curveData = footfallCurve.slice(6, 23).map((count, index) => {
          const h = index + 6;
          return {
            hour: h,
            label: h > 12 ? `${h - 12}pm` : h === 12 ? '12pm' : `${h}am`,
            people: count,
          };
        });
        setHourlyFootfall(curveData);
      } finally {
        setLoading(false);
      }
    };
    loadShopData();
  }, [shopId]);

  if (loading || !shop) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-[#4E6057]">
        <p>Loading shop details...</p>
      </div>
    );
  }

  const distanceKm = calculateDistanceKm(userCoords.lat, userCoords.lng, shop.lat, shop.lng);

  const handleAddToCart = (offerId: string, productId: string) => {
    addItem(offerId, productId, shop.id, 1);
    setAddedOfferId(offerId);
    setTimeout(() => setAddedOfferId(null), 1500);
  };

  const handleTogglePriceWatch = (offerId: string, prodName: string) => {
    const nextState = !watchedOffers[offerId];
    setWatchedOffers((prev) => ({ ...prev, [offerId]: nextState }));
    if (nextState) {
      setToastMessage(`Price watch set for ${prodName}! You'll be notified on price drop or restock.`);
    } else {
      setToastMessage(`Price watch removed for ${prodName}.`);
    }
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewText.trim()) return;
    const added = await api.addReview({
      shopId: shop.id,
      rating: newRating,
      text: newReviewText.trim(),
      author: 'Local Shopper',
    });
    setReviews([added, ...reviews]);
    setNewReviewText('');
  };

  const handleDirections = () => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${shop.lat},${shop.lng}`, '_blank');
  };

  // Crowd level formatting
  const crowdLevelText = crowd?.level === 'busy' ? 'Busy now' : crowd?.level === 'moderate' ? 'Moderate crowd' : 'Quiet now';
  const crowdLevelColor = crowd?.level === 'busy' ? '#D63A2F' : crowd?.level === 'moderate' ? '#FFB400' : '#2E7D32';

  return (
    <div className={`max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6 ${isSimpleMode ? 'text-lg' : ''}`}>
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-[#0E3B2C] text-[#FFB400] px-4 py-2.5 rounded-xl shadow-xl border border-[#FFB400] flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-top-2">
          <BellRing className="w-4 h-4 text-[#FFB400] animate-bounce" />
          <span>{toastMessage}</span>
        </div>
      )}

      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#0E3B2C] hover:underline"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>{language === 'ta' ? 'முகப்பிற்கு திரும்புக' : 'Back to Home'}</span>
      </Link>

      {/* Shop Banner Header with Trust Badges */}
      <div className="bg-[#0E3B2C] text-white rounded-2xl p-6 sm:p-8 shadow-md border border-[#1F6B4A]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-[#FFB400] shrink-0">
              <Store className="w-8 h-8" />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display font-bold text-2xl sm:text-3xl tracking-tight">
                  {language === 'ta' ? shop.nameTa || shop.name : shop.name}
                </h1>
                {shop.verified && (
                  <Badge variant="grove" size="sm" className="bg-[#1F6B4A] text-white border border-white/20">
                    <ShieldCheck className="w-3.5 h-3.5 mr-1 text-[#FFB400]" /> Verified Merchant
                  </Badge>
                )}
                <Badge variant="subtle" size="sm" className="bg-white/10 text-white border border-white/20">
                  {shop.openNow ? '🟢 ' + t('common.open') : '🔴 ' + t('common.closed')}
                </Badge>
              </div>

              <p className="text-xs sm:text-sm text-white/80 flex items-center gap-1.5 mt-1">
                <MapPin className="w-4 h-4 text-[#FFB400] shrink-0" />
                {shop.address} · Pollachi
              </p>

              {/* Trust & Operational Signals */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-white/90 mt-3">
                <span className="flex items-center gap-1 font-bold">
                  <Star className="w-3.5 h-3.5 fill-[#FFB400] text-[#FFB400]" />
                  {shop.rating} ({shop.reviewCount} reviews)
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#FFB400]" />
                  Avg reply: ~{shop.avgReplyMins || 15} mins
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-[#FFB400]" />
                  {shop.phone}
                </span>
                <span>•</span>
                <span className="font-bold text-[#FFB400]">
                  {formatDistance(distanceKm)} away
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
            <Button
              variant="marigold"
              size="md"
              onClick={handleDirections}
              className="flex items-center gap-2 font-bold text-xs"
            >
              <Navigation className="w-4 h-4" />
              <span>{t('common.directions')}</span>
            </Button>

            {/* Simple Mode Big Action: Call Shop */}
            {isSimpleMode && (
              <a
                href={`tel:${shop.phone}`}
                className="px-4 py-2.5 rounded-xl bg-white text-[#0E3B2C] font-extrabold text-sm flex items-center gap-2 shadow-md hover:bg-[#EEF3EA]"
              >
                <Phone className="w-4 h-4 text-[#1F6B4A]" />
                <span>Call Shop Directly</span>
              </a>
            )}
          </div>
        </div>

        {/* Live Crowd & Queue Status Ribbon */}
        <div className="mt-6 pt-5 border-t border-white/15 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-[#FFB400]">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white/80 uppercase">Crowd Status:</span>
                <span
                  className="text-xs font-extrabold px-2 py-0.5 rounded-full text-white"
                  style={{ backgroundColor: crowdLevelColor }}
                >
                  {crowdLevelText}
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/20 text-[#FFB400]">
                  Simulated demo
                </span>
              </div>
              <p className="text-xs text-white/70 mt-0.5">
                Estimated billing counter wait: <strong>about {crowd?.queues[0]?.waitMins || 3} mins</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-white/80">
            <span className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/15">
              🛡️ 7-Day Easy Replacement
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/15">
              ⚡ UPI / Cash / Pickup Accepted
            </span>
          </div>
        </div>
      </div>

      {/* Best Time to Visit Hourly Chart */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#DDE5D9] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#DDE5D9] pb-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display font-bold text-base sm:text-lg text-[#14201B]">
                Best Time to Visit Today
              </h3>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#EEF3EA] text-[#0E3B2C]">
                Simulated demo
              </span>
            </div>
            <p className="text-xs text-[#4E6057] mt-0.5">
              Live footfall curve based on Pollachi market hours. Marigold bar highlights the current hour.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-[#4E6057]">
              <span className="w-3 h-3 rounded-xs bg-[#BDCBB8]" /> Historical Footfall
            </span>
            <span className="flex items-center gap-1.5 font-bold text-[#0E3B2C]">
              <span className="w-3 h-3 rounded-xs bg-[#FFB400]" /> Current Hour ({currentHour > 12 ? `${currentHour - 12}pm` : `${currentHour}am`})
            </span>
          </div>
        </div>

        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hourlyFootfall} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#4E6057' }} />
              <YAxis tick={{ fontSize: 11, fill: '#4E6057' }} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-[#0E3B2C] text-white p-2 rounded-lg text-xs shadow-md border border-[#FFB400]">
                        <p className="font-bold text-[#FFB400]">{data.label}</p>
                        <p>Estimated shoppers: {data.people}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="people" radius={[4, 4, 0, 0]}>
                {hourlyFootfall.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.hour === currentHour ? '#FFB400' : '#88A392'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Products Stocked by This Shop with Stock Confidence & Reserve Button */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-xl text-[#14201B]">
            {language === 'ta' ? 'இக்கடையில் கிடைக்கும் பொருட்கள்' : 'Products Stocked Here'}{' '}
            <span className="text-[#4E6057] font-normal text-base">({offers.length})</span>
          </h2>
          <span className="text-xs text-[#4E6057]">
            Tap <strong>Hold 30m</strong> to reserve without paying now
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {offers.map((offer) => {
            const prod = products.find((p) => p.id === offer.productId);
            if (!prod) return null;

            const isCameraVerified = offer.source === 'camera';
            const isWatched = watchedOffers[offer.id];

            return (
              <div
                key={offer.id}
                className="bg-white rounded-2xl p-4 border border-[#DDE5D9] shadow-xs flex flex-col justify-between gap-3 hover:border-[#1F6B4A]/40 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <img
                      src={prod.image}
                      alt={prod.name}
                      className="w-16 h-16 rounded-xl object-cover border border-[#DDE5D9] bg-[#F7F9F4] shrink-0"
                    />
                    <div>
                      <h3 className="font-display font-bold text-sm sm:text-base text-[#14201B] line-clamp-1">
                        {language === 'ta' ? prod.nameTa || prod.name : prod.name}
                      </h3>
                      <span className="text-xs text-[#4E6057] block">{prod.unit}</span>
                      <div className="flex items-baseline gap-2 mt-0.5">
                        <span className="font-display font-bold text-base text-[#0E3B2C]">
                          {formatCurrency(offer.price)}
                        </span>
                        {offer.mrp && offer.mrp > offer.price && (
                          <span className="text-xs text-[#4E6057] line-through">
                            {formatCurrency(offer.mrp)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Price Watch Bell */}
                  <button
                    onClick={() => handleTogglePriceWatch(offer.id, prod.name)}
                    className={`p-1.5 rounded-lg border transition-all ${
                      isWatched
                        ? 'bg-[#FFFBEB] text-[#FFB400] border-[#FFB400]'
                        : 'bg-[#F7F9F4] text-[#4E6057] border-[#DDE5D9] hover:bg-[#EEF3EA]'
                    }`}
                    title={isWatched ? 'Price watch active' : 'Watch price / back in stock'}
                  >
                    {isWatched ? <BellRing className="w-4 h-4 fill-[#FFB400]" /> : <Bell className="w-4 h-4" />}
                  </button>
                </div>

                {/* Stock Confidence Label (Feature 2) */}
                <div className="pt-2 border-t border-[#DDE5D9] flex items-center justify-between text-[11px]">
                  {isCameraVerified ? (
                    <span className="flex items-center gap-1 font-semibold text-[#1F6B4A] bg-[#EEF3EA] px-2 py-0.5 rounded-full">
                      <Camera className="w-3 h-3 text-[#1F6B4A]" />
                      <span>Live from shelf camera, 2 min ago</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[#4E6057] bg-[#F7F9F4] px-2 py-0.5 rounded-full">
                      <Clock className="w-3 h-3 text-[#4E6057]" />
                      <span>Updated by owner, 3 h ago</span>
                    </span>
                  )}

                  <span className="font-bold text-[#0E3B2C]">
                    {offer.stock > 0 ? `${offer.stock} in stock` : 'Out of stock'}
                  </span>
                </div>

                {/* Action Buttons: Add to Cart & Reserve & Pick Up */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => setReserveOffer({ offer, product: prod })}
                    className="flex-1 py-2 px-3 rounded-xl border border-[#0E3B2C] text-[#0E3B2C] hover:bg-[#EEF3EA] text-xs font-bold transition-all active:scale-95 text-center cursor-pointer"
                  >
                    Hold 30m
                  </button>

                  <Button
                    variant="palm"
                    size="sm"
                    onClick={() => handleAddToCart(offer.id, prod.id)}
                    className="flex-1 text-xs"
                  >
                    <ShoppingBag className="w-3.5 h-3.5 mr-1" />
                    <span>
                      {addedOfferId === offer.id ? t('common.added') : t('common.addToCart')}
                    </span>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Customer Reviews Section */}
      <div className="bg-white rounded-2xl p-6 border border-[#DDE5D9] shadow-xs space-y-6">
        <h2 className="font-display font-bold text-xl text-[#14201B]">
          {language === 'ta' ? 'வாடிக்கையாளர் கருத்துகள்' : 'Customer Reviews & Feedback'}
        </h2>

        {/* Existing Reviews */}
        <div className="divide-y divide-[#DDE5D9]">
          {reviews.map((rev) => (
            <div key={rev.id} className="py-4 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-[#14201B]">{rev.author}</span>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${
                        i < rev.rating
                          ? 'fill-[#FFB400] text-[#FFB400]'
                          : 'fill-transparent text-[#BDCBB8]'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <p className="text-xs sm:text-sm text-[#4E6057]">{rev.text}</p>
              <span className="text-[10px] text-[#4E6057] block">{rev.date}</span>
            </div>
          ))}
        </div>

        {/* Add Review Form */}
        <form onSubmit={handleAddReview} className="p-4 rounded-xl bg-[#F7F9F4] border border-[#BDCBB8] space-y-3">
          <span className="text-xs font-bold uppercase text-[#0E3B2C] block">
            Leave Feedback for this Pollachi Merchant
          </span>
          <textarea
            rows={2}
            value={newReviewText}
            onChange={(e) => setNewReviewText(e.target.value)}
            placeholder="Share your shopping experience, pricing feedback or product quality..."
            className="w-full px-3 py-2 bg-white border border-[#BDCBB8] rounded-xl text-xs focus:outline-[#0E3B2C]"
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <span className="text-xs text-[#4E6057] mr-1">Rating:</span>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setNewRating(star)}
                  className="p-0.5"
                >
                  <Star
                    className={`w-4 h-4 ${
                      star <= newRating ? 'fill-[#FFB400] text-[#FFB400]' : 'text-[#BDCBB8]'
                    }`}
                  />
                </button>
              ))}
            </div>
            <Button type="submit" variant="palm" size="sm" className="text-xs">
              Post Review
            </Button>
          </div>
        </form>
      </div>

      {/* Reserve & Pick Up Modal */}
      {reserveOffer && (
        <ReserveModal
          isOpen={true}
          offer={reserveOffer.offer}
          product={reserveOffer.product}
          shop={shop}
          onClose={() => setReserveOffer(null)}
        />
      )}
    </div>
  );
};
