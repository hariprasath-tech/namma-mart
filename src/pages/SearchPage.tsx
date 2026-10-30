import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../api';
import { Product, Shop, Offer } from '../types';
import { useLocationStore } from '../store/location';
import { useCartStore } from '../store/cart';
import { useLangStore } from '../store/lang';
import { compareOffers } from '../lib/compareOffers';
import { formatCurrency } from '../lib/format';
import { formatDistance } from '../lib/haversine';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import {
  Search,
  Filter,
  ArrowUpDown,
  ShoppingBag,
  Star,
  Store,
  Clock,
  ArrowRight,
  X,
} from 'lucide-react';
import { VoiceSearchButton } from '../components/common/VoiceSearchButton';
import { useTranslation } from 'react-i18next';

export const SearchPage: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQ = searchParams.get('q') || '';

  const { userCoords } = useLocationStore();
  const { addItem } = useCartStore();
  const { language } = useLangStore();

  const [query, setQuery] = useState(initialQ);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [products, setProducts] = useState<Product[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [openNowOnly, setOpenNowOnly] = useState(false);
  const [hasDeliveryOnly, setHasDeliveryOnly] = useState(false);
  const [hasPickupOnly, setHasPickupOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'cheapest' | 'closest' | 'topRated'>('cheapest');
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [addedOfferId, setAddedOfferId] = useState<string | null>(null);

  const categories = [
    'All',
    'Grocery',
    'Electronics',
    'Stationery',
    'Hardware',
    'Pharmacy',
    'Fashion',
    'Home needs',
  ];

  useEffect(() => {
    const load = async () => {
      try {
        const [p, s, o] = await Promise.all([
          api.getProducts(),
          api.getShops(),
          api.getOffers(),
        ]);
        setProducts(p);
        setShops(s);
        setOffers(o);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Filter products by category and search text
  const filteredProducts = useMemo(() => {
    let prods = products;
    if (selectedCategory !== 'All') {
      prods = prods.filter((p) => p.category === selectedCategory);
    }
    if (query.trim()) {
      const q = query.toLowerCase().trim();
      prods = prods.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.nameTa && p.nameTa.toLowerCase().includes(q)) ||
          p.description.toLowerCase().includes(q)
      );
    }
    return prods;
  }, [products, selectedCategory, query]);

  // For each product, compute the best nearby offer according to current filters & sort
  const productOfferCards = useMemo(() => {
    return filteredProducts
      .map((product) => {
        const results = compareOffers(
          product.id,
          userCoords,
          {
            openNowOnly,
            hasDeliveryOnly,
            hasPickupOnly,
            sortBy,
          },
          offers,
          shops,
          products
        );

        if (results.length === 0) return null;
        const bestResult = results[0]; // Top ranked offer for this product
        return {
          product,
          bestResult,
          totalOffers: results.length,
        };
      })
      .filter(Boolean) as {
      product: Product;
      bestResult: ReturnType<typeof compareOffers>[0];
      totalOffers: number;
    }[];
  }, [
    filteredProducts,
    userCoords,
    openNowOnly,
    hasDeliveryOnly,
    hasPickupOnly,
    sortBy,
    offers,
    shops,
    products,
  ]);

  const handleAddToCart = (offerId: string, productId: string, shopId: string) => {
    addItem(offerId, productId, shopId, 1);
    setAddedOfferId(offerId);
    setTimeout(() => setAddedOfferId(null), 1500);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Search Header Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#DDE5D9] shadow-xs space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-[#4E6057] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSearchParams(e.target.value ? { q: e.target.value } : {});
              }}
              placeholder={t('home.searchPlaceholder')}
              className="w-full pl-11 pr-4 py-3 bg-[#F7F9F4] border border-[#BDCBB8] rounded-xl text-base focus:outline-[#0E3B2C]"
            />
            {query && (
              <button
                onClick={() => {
                  setQuery('');
                  setSearchParams({});
                }}
                className="absolute right-12 top-1/2 -translate-y-1/2 p-1 text-[#4E6057]"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <VoiceSearchButton
                onTranscript={(text) => {
                  setQuery(text);
                  setSearchParams({ q: text });
                }}
              />
            </div>
          </div>

          <Button
            variant="outline"
            size="md"
            onClick={() => setShowFilterDrawer(!showFilterDrawer)}
            className="flex items-center gap-1.5 shrink-0"
          >
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Filters</span>
          </Button>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold shrink-0 transition-colors ${
                selectedCategory === cat
                  ? 'bg-[#0E3B2C] text-white'
                  : 'bg-[#F7F9F4] text-[#4E6057] border border-[#DDE5D9] hover:bg-[#EEF3EA]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Filter Drawer / Accordion */}
        {showFilterDrawer && (
          <div className="bg-[#F7F9F4] rounded-xl p-4 border border-[#DDE5D9] space-y-3 animate-in slide-in-from-top duration-150">
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-[#14201B]">Availability:</span>
                <button
                  onClick={() => setOpenNowOnly(!openNowOnly)}
                  className={`px-3 py-1 rounded-full font-medium ${
                    openNowOnly
                      ? 'bg-[#0E3B2C] text-white'
                      : 'bg-white border border-[#BDCBB8] text-[#4E6057]'
                  }`}
                >
                  {t('compare.filterOpenNow')}
                </button>
                <button
                  onClick={() => setHasDeliveryOnly(!hasDeliveryOnly)}
                  className={`px-3 py-1 rounded-full font-medium ${
                    hasDeliveryOnly
                      ? 'bg-[#0E3B2C] text-white'
                      : 'bg-white border border-[#BDCBB8] text-[#4E6057]'
                  }`}
                >
                  {t('compare.filterDelivery')}
                </button>
                <button
                  onClick={() => setHasPickupOnly(!hasPickupOnly)}
                  className={`px-3 py-1 rounded-full font-medium ${
                    hasPickupOnly
                      ? 'bg-[#0E3B2C] text-white'
                      : 'bg-white border border-[#BDCBB8] text-[#4E6057]'
                  }`}
                >
                  {t('compare.filterPickup')}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4 text-[#4E6057]" />
                <span className="font-bold text-[#14201B]">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(e.target.value as 'cheapest' | 'closest' | 'topRated')
                  }
                  className="bg-white border border-[#BDCBB8] rounded-lg px-2.5 py-1 text-xs font-semibold"
                >
                  <option value="cheapest">{t('compare.sortCheapest')}</option>
                  <option value="closest">{t('compare.sortClosest')}</option>
                  <option value="topRated">{t('compare.sortRating')}</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-display font-bold text-xl text-[#14201B]">
          {language === 'ta' ? 'கிடைக்கும் பொருட்கள்' : 'Available Products'}{' '}
          <span className="text-[#4E6057] font-normal text-base">
            ({productOfferCards.length})
          </span>
        </h2>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="py-16 text-center text-[#4E6057]">
          <p>Searching Pollachi shops...</p>
        </div>
      ) : productOfferCards.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-[#DDE5D9] space-y-3">
          <p className="text-base text-[#14201B] font-semibold">
            {language === 'ta'
              ? 'இந்த பகுதி கடைகளில் இந்த பொருள் தற்போது இல்லை.'
              : 'No nearby shops stock this item with your chosen filters.'}
          </p>
          <p className="text-xs text-[#4E6057]">
            Try clearing filters or search for another item like rice, oil, or LED bulb.
          </p>
          <Button
            variant="palm"
            size="sm"
            onClick={() => {
              setQuery('');
              setSelectedCategory('All');
              setOpenNowOnly(false);
              setHasDeliveryOnly(false);
              setHasPickupOnly(false);
            }}
          >
            Reset Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {productOfferCards.map(({ product, bestResult, totalOffers }) => {
            const { offer, shop, distanceKm, isCheapest } = bestResult;

            return (
              <div
                key={product.id}
                className="bg-white rounded-2xl p-5 border border-[#DDE5D9] shadow-xs flex flex-col justify-between hover:border-[#0E3B2C] transition-all group"
              >
                <div>
                  <div className="relative mb-3 rounded-xl overflow-hidden bg-[#F7F9F4] h-44">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 left-2 flex gap-1">
                      <Badge variant="subtle" size="sm">
                        {product.category}
                      </Badge>
                      {isCheapest && (
                        <Badge variant="marigold" size="sm">
                          {t('compare.cheapestBadge')}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <h3 className="font-display font-bold text-lg text-[#14201B] line-clamp-1">
                    {language === 'ta' ? product.nameTa || product.name : product.name}
                  </h3>
                  <span className="text-xs text-[#4E6057] block mb-2">{product.unit}</span>

                  {/* Best Shop Offer Highlight */}
                  <div className="bg-[#F7F9F4] rounded-xl p-3 border border-[#DDE5D9] mb-4 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#0E3B2C] flex items-center gap-1 truncate max-w-[170px]">
                        <Store className="w-3.5 h-3.5 shrink-0" />
                        {shop.name}
                      </span>
                      <span className="text-[#4E6057] font-medium shrink-0">
                        {formatDistance(distanceKm)}
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between pt-1">
                      <div className="flex items-baseline gap-2">
                        <span className="font-display font-extrabold text-2xl text-[#0E3B2C]">
                          {formatCurrency(offer.price)}
                        </span>
                        {offer.mrp && offer.mrp > offer.price && (
                          <span className="text-xs text-[#4E6057] line-through">
                            {formatCurrency(offer.mrp)}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-semibold text-[#1F6B4A]">
                        {bestResult.summaryLabel}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions: Add to Cart + Compare */}
                <div className="space-y-2 pt-2">
                  <Button
                    variant={isCheapest ? 'marigold' : 'palm'}
                    size="md"
                    fullWidth
                    onClick={() => handleAddToCart(offer.id, product.id, shop.id)}
                  >
                    <ShoppingBag className="w-4 h-4 mr-1.5" />
                    <span>
                      {addedOfferId === offer.id ? t('common.added') : t('common.addToCart')}
                    </span>
                  </Button>

                  <Link
                    to={`/compare?productId=${product.id}`}
                    className="w-full flex items-center justify-center py-2 text-xs font-bold text-[#0E3B2C] bg-[#EEF3EA] hover:bg-[#DDE5D9] rounded-lg transition-colors"
                  >
                    <span>
                      {language === 'ta'
                        ? `${totalOffers} கடைகளில் ஒப்பிடவும்`
                        : `Compare ${totalOffers} shops side-by-side`}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
