import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';
import { Shop, Product, Offer, Review } from '../types';
import { useCartStore } from '../store/cart';
import { useLocationStore } from '../store/location';
import { useLangStore } from '../store/lang';
import { formatCurrency } from '../lib/format';
import { calculateDistanceKm, formatDistance } from '../lib/haversine';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
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
  Send,
  CheckCircle2,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const ShopPage: React.FC = () => {
  const { t } = useTranslation();
  const { shopId } = useParams<{ shopId: string }>();
  const { userCoords } = useLocationStore();
  const { addItem } = useCartStore();
  const { language } = useLangStore();

  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const [newReviewText, setNewReviewText] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [addedOfferId, setAddedOfferId] = useState<string | null>(null);

  useEffect(() => {
    const loadShopData = async () => {
      if (!shopId) return;
      try {
        const [allShops, allProds, allOffers, allRevs] = await Promise.all([
          api.getShops(),
          api.getProducts(),
          api.getOffers(undefined, shopId),
          api.getReviews(shopId),
        ]);
        const matchedShop = allShops.find((s: Shop) => s.id === shopId) || allShops[0];
        setShop(matchedShop);
        setProducts(allProds);
        setOffers(allOffers);
        setReviews(allRevs);
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

  // Open google maps directions
  const handleDirections = () => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${shop.lat},${shop.lng}`, '_blank');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#0E3B2C] hover:underline"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>{language === 'ta' ? 'முகப்பிற்கு திரும்புக' : 'Back to Home'}</span>
      </Link>

      {/* Shop Banner Header */}
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
                <Badge variant="grove" size="sm" className="bg-[#1F6B4A] text-white border border-white/20">
                  {shop.openNow ? '🟢 ' + t('common.open') : '🔴 ' + t('common.closed')}
                </Badge>
              </div>

              <p className="text-xs sm:text-sm text-white/80 flex items-center gap-1.5 mt-1">
                <MapPin className="w-4 h-4 text-[#FFB400] shrink-0" />
                {shop.address}
              </p>

              <div className="flex flex-wrap items-center gap-3 text-xs text-white/90 mt-3">
                <span className="flex items-center gap-1 font-bold">
                  <Star className="w-3.5 h-3.5 fill-[#FFB400] text-[#FFB400]" />
                  {shop.rating} ({shop.reviewCount} reviews)
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#FFB400]" />
                  {shop.hours}
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

          <Button
            variant="marigold"
            size="md"
            onClick={handleDirections}
            className="shrink-0 flex items-center gap-2 self-start md:self-auto"
          >
            <Navigation className="w-4 h-4" />
            <span>{t('common.directions')}</span>
          </Button>
        </div>
      </div>

      {/* Products Stocked by This Shop */}
      <div className="space-y-4">
        <h2 className="font-display font-bold text-xl text-[#14201B]">
          {language === 'ta' ? 'இக்கடையில் கிடைக்கும் பொருட்கள்' : 'Products Available at this Store'}{' '}
          <span className="text-[#4E6057] font-normal text-base">({offers.length})</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {offers.map((offer) => {
            const prod = products.find((p) => p.id === offer.productId);
            if (!prod) return null;

            return (
              <div
                key={offer.id}
                className="bg-white rounded-2xl p-4 border border-[#DDE5D9] shadow-xs flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={prod.image}
                    alt={prod.name}
                    className="w-14 h-14 rounded-xl object-cover border border-[#DDE5D9] bg-[#F7F9F4] shrink-0"
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

                <div className="flex flex-col items-end gap-2">
                  <Button
                    variant="palm"
                    size="sm"
                    onClick={() => handleAddToCart(offer.id, prod.id)}
                  >
                    <ShoppingBag className="w-3.5 h-3.5 mr-1" />
                    <span>
                      {addedOfferId === offer.id ? t('common.added') : t('common.addToCart')}
                    </span>
                  </Button>

                  <Link
                    to={`/compare?productId=${prod.id}`}
                    className="text-[11px] font-semibold text-[#0E3B2C] hover:underline"
                  >
                    Compare prices
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reviews Section */}
      <div className="bg-white rounded-2xl p-6 border border-[#DDE5D9] shadow-xs space-y-6">
        <h2 className="font-display font-bold text-xl text-[#14201B]">
          {language === 'ta' ? 'வாடிக்கையாளர் கருத்துகள்' : 'Customer Reviews & Feedback'}
        </h2>

        {/* Existing Reviews */}
        <div className="space-y-4 divide-y divide-[#DDE5D9]">
          {reviews.length === 0 ? (
            <p className="text-xs text-[#4E6057]">No reviews yet for this shop.</p>
          ) : (
            reviews.map((rev) => (
              <div key={rev.id} className="pt-4 first:pt-0 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-[#14201B]">{rev.author}</span>
                  <div className="flex items-center gap-1">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-[#FFB400] text-[#FFB400]" />
                    ))}
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-[#4E6057]">
                  {language === 'ta' && rev.textTa ? rev.textTa : rev.text}
                </p>
                <span className="text-[11px] text-[#4E6057]/70 block">{rev.date}</span>
              </div>
            ))
          )}
        </div>

        {/* Add Review Form */}
        <form onSubmit={handleAddReview} className="border-t border-[#DDE5D9] pt-4 space-y-3">
          <span className="font-bold text-sm text-[#14201B] block">
            Write a quick review
          </span>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[#4E6057]">Rating:</span>
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setNewRating(s)}
                className="p-0.5 focus:outline-hidden"
              >
                <Star
                  className={`w-5 h-5 ${
                    s <= newRating ? 'fill-[#FFB400] text-[#FFB400]' : 'text-[#BDCBB8]'
                  }`}
                />
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              required
              placeholder="e.g. Clean grocery packing and polite service..."
              value={newReviewText}
              onChange={(e) => setNewReviewText(e.target.value)}
              className="flex-1 px-3.5 py-2 bg-[#F7F9F4] border border-[#BDCBB8] rounded-xl text-sm focus:outline-[#0E3B2C]"
            />
            <Button type="submit" variant="palm" size="md">
              <Send className="w-4 h-4 mr-1" />
              <span>Post</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
