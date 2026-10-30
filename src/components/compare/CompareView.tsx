import React, { useState } from 'react';
import { Product, Shop, Offer, LocationCoords, ComparisonFilter } from '../../types';
import { compareOffers } from '../../lib/compareOffers';
import { formatCurrency, formatEstTime } from '../../lib/format';
import { formatDistance } from '../../lib/haversine';
import { useCartStore } from '../../store/cart';
import { useLangStore } from '../../store/lang';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Star, Clock, Truck, Store, Check, ArrowUpDown, Filter, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface CompareViewProps {
  products: Product[];
  selectedProductId: string;
  onSelectProduct: (productId: string) => void;
  userCoords: LocationCoords;
  offers: Offer[];
  shops: Shop[];
}

export const CompareView: React.FC<CompareViewProps> = ({
  products,
  selectedProductId,
  onSelectProduct,
  userCoords,
  offers,
  shops,
}) => {
  const { t } = useTranslation();
  const { addItem } = useCartStore();
  const { language } = useLangStore();

  const [filter, setFilter] = useState<ComparisonFilter>({
    sortBy: 'cheapest',
    openNowOnly: false,
    hasDeliveryOnly: false,
    hasPickupOnly: false,
  });

  const [addedOfferId, setAddedOfferId] = useState<string | null>(null);

  const selectedProduct = products.find((p) => p.id === selectedProductId) || products[0];

  const results = compareOffers(
    selectedProduct.id,
    userCoords,
    filter,
    offers,
    shops,
    products
  );

  const handleAddToCart = (offerId: string, shopId: string) => {
    addItem(offerId, selectedProduct.id, shopId, 1);
    setAddedOfferId(offerId);
    setTimeout(() => setAddedOfferId(null), 1500);
  };

  return (
    <div className="space-y-6">
      {/* Product Selector Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-[#DDE5D9] shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src={selectedProduct.image}
              alt={selectedProduct.name}
              className="w-16 h-16 rounded-xl object-cover border border-[#DDE5D9] bg-[#F7F9F4] shrink-0"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#EEF3EA] text-[#0E3B2C]">
                  {selectedProduct.category}
                </span>
                <span className="text-xs text-[#4E6057]">{selectedProduct.unit}</span>
              </div>
              <h1 className="font-display font-bold text-xl sm:text-2xl text-[#14201B] mt-0.5">
                {language === 'ta' ? selectedProduct.nameTa || selectedProduct.name : selectedProduct.name}
              </h1>
              <p className="text-xs text-[#4E6057] line-clamp-1 max-w-xl">
                {language === 'ta' ? selectedProduct.descriptionTa || selectedProduct.description : selectedProduct.description}
              </p>
            </div>
          </div>

          {/* Product Switcher Dropdown */}
          <div className="flex items-center gap-2">
            <label htmlFor="prod-select" className="text-xs font-semibold text-[#4E6057] shrink-0">
              {language === 'ta' ? 'பொருளை மாற்ற:' : 'Compare another:'}
            </label>
            <select
              id="prod-select"
              value={selectedProduct.id}
              onChange={(e) => onSelectProduct(e.target.value)}
              className="bg-[#F7F9F4] border border-[#BDCBB8] rounded-xl px-3 py-2 text-sm font-medium text-[#14201B] focus:outline-[#0E3B2C] max-w-xs"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {language === 'ta' ? p.nameTa || p.name : p.name} ({p.category})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter & Sort Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-4 mt-4 border-t border-[#DDE5D9] text-xs sm:text-sm">
          <div className="flex items-center gap-1 text-[#0E3B2C] font-semibold mr-2">
            <Filter className="w-3.5 h-3.5" />
            <span>{language === 'ta' ? 'வடிகட்டி:' : 'Filters:'}</span>
          </div>

          {/* Open Now Toggle */}
          <button
            onClick={() => setFilter((f) => ({ ...f, openNowOnly: !f.openNowOnly }))}
            className={`px-3 py-1.5 rounded-full font-medium transition-all ${
              filter.openNowOnly
                ? 'bg-[#0E3B2C] text-white'
                : 'bg-[#F7F9F4] text-[#4E6057] border border-[#DDE5D9] hover:bg-[#EEF3EA]'
            }`}
          >
            {t('compare.filterOpenNow')}
          </button>

          {/* Delivery Toggle */}
          <button
            onClick={() => setFilter((f) => ({ ...f, hasDeliveryOnly: !f.hasDeliveryOnly }))}
            className={`px-3 py-1.5 rounded-full font-medium transition-all ${
              filter.hasDeliveryOnly
                ? 'bg-[#0E3B2C] text-white'
                : 'bg-[#F7F9F4] text-[#4E6057] border border-[#DDE5D9] hover:bg-[#EEF3EA]'
            }`}
          >
            {t('compare.filterDelivery')}
          </button>

          {/* Pickup Toggle */}
          <button
            onClick={() => setFilter((f) => ({ ...f, hasPickupOnly: !f.hasPickupOnly }))}
            className={`px-3 py-1.5 rounded-full font-medium transition-all ${
              filter.hasPickupOnly
                ? 'bg-[#0E3B2C] text-white'
                : 'bg-[#F7F9F4] text-[#4E6057] border border-[#DDE5D9] hover:bg-[#EEF3EA]'
            }`}
          >
            {t('compare.filterPickup')}
          </button>

          <div className="ml-auto flex items-center gap-2">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#4E6057]" />
            <select
              value={filter.sortBy}
              onChange={(e) =>
                setFilter((f) => ({
                  ...f,
                  sortBy: e.target.value as 'cheapest' | 'closest' | 'topRated',
                }))
              }
              className="bg-[#F7F9F4] border border-[#BDCBB8] rounded-lg px-2.5 py-1 text-xs font-semibold text-[#14201B]"
            >
              <option value="cheapest">{t('compare.sortCheapest')}</option>
              <option value="closest">{t('compare.sortClosest')}</option>
              <option value="topRated">{t('compare.sortRating')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Comparison Results */}
      {results.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-[#DDE5D9]">
          <p className="text-base text-[#4E6057]">
            {language === 'ta'
              ? 'தேர்வு செய்த வடிகட்டிகளுக்கு கடைகள் எதுவும் கிடைக்கவில்லை. வடிகட்டிகளை மாற்றிப் பார்க்கவும்.'
              : 'No local shops match your selected filters. Try clearing some filters.'}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Side-by-Side Comparison Table */}
          <div className="hidden lg:block bg-white rounded-2xl border border-[#DDE5D9] overflow-hidden shadow-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#EEF3EA] border-b border-[#DDE5D9]">
                  <th className="py-4 px-6 text-xs font-bold text-[#0E3B2C] uppercase tracking-wider w-44">
                    {language === 'ta' ? 'அம்சங்கள்' : 'Attribute'}
                  </th>
                  {results.map((res) => (
                    <th
                      key={res.shop.id}
                      className={`py-4 px-6 text-sm font-bold ${
                        res.isCheapest
                          ? 'bg-[#FFB400]/15 border-x-2 border-t-2 border-[#FFB400] text-[#14201B]'
                          : 'text-[#14201B]'
                      }`}
                    >
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Link
                            to={`/shop/${res.shop.id}`}
                            className="hover:underline font-display text-base"
                          >
                            {language === 'ta' ? res.shop.nameTa || res.shop.name : res.shop.name}
                          </Link>
                          {res.isCheapest && (
                            <Badge variant="marigold" size="sm">
                              {t('compare.cheapestBadge')}
                            </Badge>
                          )}
                          {res.isClosest && (
                            <Badge variant="grove" size="sm">
                              {t('compare.closestBadge')}
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs font-normal text-[#4E6057]">
                          {res.shop.area}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDE5D9] text-sm">
                {/* Price Row */}
                <tr>
                  <td className="py-4 px-6 font-semibold text-[#4E6057]">
                    {t('compare.price')}
                  </td>
                  {results.map((res) => (
                    <td
                      key={res.shop.id}
                      className={`py-4 px-6 ${
                        res.isCheapest ? 'bg-[#FFB400]/10 border-x-2 border-[#FFB400]' : ''
                      }`}
                    >
                      <div className="flex items-baseline gap-2">
                        <span
                          className={`font-display text-2xl font-extrabold ${
                            res.isCheapest ? 'text-[#0E3B2C]' : 'text-[#14201B]'
                          }`}
                        >
                          {formatCurrency(res.offer.price)}
                        </span>
                        {res.offer.mrp && res.offer.mrp > res.offer.price && (
                          <span className="text-xs text-[#4E6057] line-through">
                            {formatCurrency(res.offer.mrp)}
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-medium text-[#1F6B4A]">
                        {res.summaryLabel}
                      </span>
                    </td>
                  ))}
                </tr>

                {/* Distance Row */}
                <tr>
                  <td className="py-4 px-6 font-semibold text-[#4E6057]">
                    {t('compare.distance')}
                  </td>
                  {results.map((res) => (
                    <td
                      key={res.shop.id}
                      className={`py-4 px-6 ${
                        res.isCheapest ? 'bg-[#FFB400]/10 border-x-2 border-[#FFB400]' : ''
                      }`}
                    >
                      <span className="font-semibold text-[#14201B]">
                        {formatDistance(res.distanceKm)}
                      </span>
                      <span className="text-xs text-[#4E6057] block">
                        {language === 'ta' ? 'உங்கள் இருப்பிடத்தில் இருந்து' : 'from current location'}
                      </span>
                    </td>
                  ))}
                </tr>

                {/* Rating Row */}
                <tr>
                  <td className="py-4 px-6 font-semibold text-[#4E6057]">
                    {t('compare.rating')}
                  </td>
                  {results.map((res) => (
                    <td
                      key={res.shop.id}
                      className={`py-4 px-6 ${
                        res.isCheapest ? 'bg-[#FFB400]/10 border-x-2 border-[#FFB400]' : ''
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-[#14201B]">
                        <Star className="w-4 h-4 fill-[#FFB400] text-[#FFB400]" />
                        <span>{res.shop.rating}</span>
                        <span className="text-xs text-[#4E6057] font-normal">
                          ({res.shop.reviewCount} {t('common.reviews')})
                        </span>
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Stock Row */}
                <tr>
                  <td className="py-4 px-6 font-semibold text-[#4E6057]">
                    {t('compare.stock')}
                  </td>
                  {results.map((res) => (
                    <td
                      key={res.shop.id}
                      className={`py-4 px-6 ${
                        res.isCheapest ? 'bg-[#FFB400]/10 border-x-2 border-[#FFB400]' : ''
                      }`}
                    >
                      <span
                        className={`inline-flex items-center gap-1 font-semibold text-xs px-2.5 py-1 rounded-full ${
                          res.offer.stock < 5
                            ? 'bg-[#D63A2F]/15 text-[#D63A2F]'
                            : 'bg-[#EEF3EA] text-[#0E3B2C]'
                        }`}
                      >
                        {res.offer.stock < 5 ? '⚠️ ' : '✓ '}
                        {res.offer.stock} {t('compare.inStock')}
                      </span>
                    </td>
                  ))}
                </tr>

                {/* Fulfilment Row */}
                <tr>
                  <td className="py-4 px-6 font-semibold text-[#4E6057]">
                    {t('compare.fulfilment')}
                  </td>
                  {results.map((res) => (
                    <td
                      key={res.shop.id}
                      className={`py-4 px-6 ${
                        res.isCheapest ? 'bg-[#FFB400]/10 border-x-2 border-[#FFB400]' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2 text-xs font-medium">
                        {res.shop.delivery && (
                          <span className="flex items-center gap-1 text-[#1F6B4A]">
                            <Truck className="w-3.5 h-3.5" />
                            {language === 'ta' ? 'டெலிவரி' : 'Delivery'}
                          </span>
                        )}
                        {res.shop.pickup && (
                          <span className="flex items-center gap-1 text-[#0E3B2C]">
                            <Store className="w-3.5 h-3.5" />
                            {language === 'ta' ? 'பிக்கப்' : 'Pickup'}
                          </span>
                        )}
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Est Time Row */}
                <tr>
                  <td className="py-4 px-6 font-semibold text-[#4E6057]">
                    {t('compare.estTime')}
                  </td>
                  {results.map((res) => (
                    <td
                      key={res.shop.id}
                      className={`py-4 px-6 ${
                        res.isCheapest ? 'bg-[#FFB400]/10 border-x-2 border-[#FFB400]' : ''
                      }`}
                    >
                      <span className="flex items-center gap-1.5 text-xs text-[#4E6057]">
                        <Clock className="w-3.5 h-3.5 text-[#1F6B4A]" />
                        {formatEstTime(res.offer.deliveryEstMins, 'delivery')}
                      </span>
                    </td>
                  ))}
                </tr>

                {/* Action Row */}
                <tr>
                  <td className="py-5 px-6 font-semibold text-[#4E6057]">
                    {t('compare.action')}
                  </td>
                  {results.map((res) => (
                    <td
                      key={res.shop.id}
                      className={`py-5 px-6 ${
                        res.isCheapest ? 'bg-[#FFB400]/10 border-x-2 border-b-2 border-[#FFB400]' : ''
                      }`}
                    >
                      <Button
                        variant={res.isCheapest ? 'marigold' : 'palm'}
                        size="md"
                        fullWidth
                        onClick={() => handleAddToCart(res.offer.id, res.shop.id)}
                      >
                        <ShoppingBag className="w-4 h-4 mr-2" />
                        <span>
                          {addedOfferId === res.offer.id
                            ? t('common.added')
                            : `${t('common.addToCart')} (${formatCurrency(res.offer.price)})`}
                        </span>
                      </Button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Mobile Swipeable Card Deck */}
          <div className="lg:hidden space-y-4">
            {results.map((res) => (
              <div
                key={res.shop.id}
                className={`bg-white rounded-2xl p-5 border-2 transition-all shadow-xs ${
                  res.isCheapest
                    ? 'border-[#FFB400] ring-4 ring-[#FFB400]/15'
                    : 'border-[#DDE5D9]'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        to={`/shop/${res.shop.id}`}
                        className="font-display font-bold text-lg text-[#14201B] hover:underline"
                      >
                        {language === 'ta' ? res.shop.nameTa || res.shop.name : res.shop.name}
                      </Link>
                      {res.isCheapest && (
                        <Badge variant="marigold" size="sm">
                          {t('compare.cheapestBadge')}
                        </Badge>
                      )}
                      {res.isClosest && (
                        <Badge variant="grove" size="sm">
                          {t('compare.closestBadge')}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-[#4E6057]">{res.shop.area}</p>
                  </div>

                  <div className="text-right">
                    <span className="font-display font-extrabold text-2xl text-[#0E3B2C] block">
                      {formatCurrency(res.offer.price)}
                    </span>
                    {res.offer.mrp && res.offer.mrp > res.offer.price && (
                      <span className="text-xs text-[#4E6057] line-through">
                        {formatCurrency(res.offer.mrp)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 py-3 border-y border-[#DDE5D9] text-xs text-center">
                  <div>
                    <span className="text-[#4E6057] block">{t('compare.distance')}</span>
                    <span className="font-bold text-[#14201B]">
                      {formatDistance(res.distanceKm)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#4E6057] block">{t('compare.rating')}</span>
                    <span className="font-bold text-[#14201B] inline-flex items-center gap-0.5">
                      <Star className="w-3 h-3 fill-[#FFB400] text-[#FFB400]" />
                      {res.shop.rating}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#4E6057] block">{t('compare.stock')}</span>
                    <span
                      className={`font-semibold ${
                        res.offer.stock < 5 ? 'text-[#D63A2F]' : 'text-[#0E3B2C]'
                      }`}
                    >
                      {res.offer.stock} left
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-[#4E6057] pt-3 pb-4">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#1F6B4A]" />
                    {formatEstTime(res.offer.deliveryEstMins, 'delivery')}
                  </span>
                  <span className="font-medium text-[#1F6B4A]">
                    {res.summaryLabel}
                  </span>
                </div>

                <Button
                  variant={res.isCheapest ? 'marigold' : 'palm'}
                  size="md"
                  fullWidth
                  onClick={() => handleAddToCart(res.offer.id, res.shop.id)}
                >
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  <span>
                    {addedOfferId === res.offer.id
                      ? t('common.added')
                      : `${t('common.addToCart')} (${formatCurrency(res.offer.price)})`}
                  </span>
                </Button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
