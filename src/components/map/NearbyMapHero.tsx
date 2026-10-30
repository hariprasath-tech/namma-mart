import React, { useState, useMemo, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  Search,
  ShoppingBag,
  ArrowRight,
  Star,
  Clock,
  Navigation,
  X,
  Store,
  LocateFixed,
  ZoomIn,
  ZoomOut,
  Users,
  ShieldCheck,
} from 'lucide-react';
import { useLocationStore } from '../../store/location';
import { useCartStore } from '../../store/cart';
import { useLangStore } from '../../store/lang';
import { Shop, Product, Offer } from '../../types';
import { calculateDistanceKm, formatDistance } from '../../lib/haversine';
import { formatCurrency, formatEstTime } from '../../lib/format';
import { Link } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { VoiceSearchButton } from '../common/VoiceSearchButton';
import { useTranslation } from 'react-i18next';

interface NearbyMapHeroProps {
  shops: Shop[];
  products: Product[];
  offers: Offer[];
  initialSearch?: string;
  onSearchChange?: (query: string) => void;
}

// Controller component to smoothly reposition and fit bounds
function MapController({
  userLat,
  userLng,
  shops,
}: {
  userLat: number;
  userLng: number;
  shops: Shop[];
}) {
  const map = useMap();
  const prevCoordsRef = useRef({ lat: userLat, lng: userLng });

  useEffect(() => {
    if (prevCoordsRef.current.lat !== userLat || prevCoordsRef.current.lng !== userLng) {
      prevCoordsRef.current = { lat: userLat, lng: userLng };
      map.flyTo([userLat, userLng], 14, { duration: 1.0 });
    }
  }, [userLat, userLng, map]);

  useEffect(() => {
    if (shops.length > 0) {
      const bounds = L.latLngBounds([[userLat, userLng]]);
      shops.forEach((s) => bounds.extend([s.lat, s.lng]));
      map.fitBounds(bounds, { padding: [56, 56], maxZoom: 15 });
    }
  }, [shops, userLat, userLng, map]);

  return null;
}

export const NearbyMapHero: React.FC<NearbyMapHeroProps> = ({
  shops,
  products,
  offers,
  initialSearch = 'rice',
  onSearchChange,
}) => {
  const { t } = useTranslation();
  const { userCoords } = useLocationStore();
  const { addItem } = useCartStore();
  const { language } = useLangStore();

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);
  const [addedOfferId, setAddedOfferId] = useState<string | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  const categories = [
    { id: 'All', label: t('home.categories.all'), emoji: '🛍️' },
    { id: 'Grocery', label: t('home.categories.grocery'), emoji: '🌾' },
    { id: 'Electronics', label: t('home.categories.electronics'), emoji: '⚡' },
    { id: 'Stationery', label: t('home.categories.stationery'), emoji: '📚' },
    { id: 'Hardware', label: t('home.categories.hardware'), emoji: '🔧' },
    { id: 'Pharmacy', label: t('home.categories.pharmacy'), emoji: '💊' },
    { id: 'Fashion', label: t('home.categories.fashion'), emoji: '👕' },
    { id: 'Home needs', label: t('home.categories.homeNeeds'), emoji: '🏠' },
  ];

  const quickPills = ['rice', 'coconut oil', 'LED bulb', 'notebook', 'Dolo 650'];

  const handleQueryChange = (val: string) => {
    setSearchQuery(val);
    if (onSearchChange) onSearchChange(val);
  };

  // Find product matching current search query
  const matchedProduct = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase().trim();
    return (
      products.find(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.nameTa && p.nameTa.toLowerCase().includes(q))
      ) || null
    );
  }, [searchQuery, products]);

  // Compute offers for the matched product across shops
  const shopOffersMap = useMemo(() => {
    if (!matchedProduct) return new Map<string, { offer: Offer; distanceKm: number }>();

    const map = new Map<string, { offer: Offer; distanceKm: number }>();
    const prodOffers = offers.filter((o) => o.productId === matchedProduct.id);

    for (const off of prodOffers) {
      const sh = shops.find((s) => s.id === off.shopId);
      if (sh) {
        const dist = calculateDistanceKm(userCoords.lat, userCoords.lng, sh.lat, sh.lng);
        map.set(sh.id, { offer: off, distanceKm: dist });
      }
    }
    return map;
  }, [matchedProduct, offers, shops, userCoords]);

  // Determine lowest price and closest distance
  const { cheapestShopId, closestShopId } = useMemo(() => {
    if (shopOffersMap.size === 0) return { cheapestShopId: null, closestShopId: null };

    let lowestPrice = Infinity;
    let minDistance = Infinity;
    let cheapestId: string | null = null;
    let closestId: string | null = null;

    shopOffersMap.forEach(({ offer, distanceKm }, shopId) => {
      if (offer.stock > 0 && offer.price < lowestPrice) {
        lowestPrice = offer.price;
        cheapestId = shopId;
      }
      if (distanceKm < minDistance) {
        minDistance = distanceKm;
        closestId = shopId;
      }
    });

    return { cheapestShopId: cheapestId, closestShopId: closestId };
  }, [shopOffersMap]);

  // Currently focused shop in sheet
  const activeShopData = useMemo(() => {
    if (!selectedShopId) return null;
    const shop = shops.find((s) => s.id === selectedShopId);
    if (!shop) return null;

    const offerInfo = shopOffersMap.get(shop.id);
    const distanceKm = calculateDistanceKm(userCoords.lat, userCoords.lng, shop.lat, shop.lng);

    return {
      shop,
      offer: offerInfo?.offer,
      distanceKm,
      isCheapest: shop.id === cheapestShopId,
      isClosest: shop.id === closestShopId,
    };
  }, [selectedShopId, shops, shopOffersMap, userCoords, cheapestShopId, closestShopId]);

  const handleAddToCart = (offer: Offer, shop: Shop) => {
    if (!matchedProduct) return;
    addItem(offer.id, matchedProduct.id, shop.id, 1);
    setAddedOfferId(offer.id);
    setTimeout(() => setAddedOfferId(null), 1800);
  };

  // Recenter button
  const handleRecenter = () => {
    if (mapRef.current) {
      mapRef.current.flyTo([userCoords.lat, userCoords.lng], 14, { duration: 0.8 });
    }
  };

  // Zoom controls
  const handleZoom = (delta: number) => {
    if (mapRef.current) {
      mapRef.current.setZoom(mapRef.current.getZoom() + delta);
    }
  };

  // User location custom pulse icon
  const userLocationIcon = useMemo(() => {
    return L.divIcon({
      className: '',
      html: `
        <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 34px; height: 34px; border-radius: 9999px; background: rgba(31, 107, 74, 0.25); animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="width: 20px; height: 20px; border-radius: 9999px; background: #0E3B2C; border: 3px solid #FFFFFF; box-shadow: 0 2px 8px rgba(0,0,0,0.35);"></div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });
  }, []);

  // Filtered shops based on selected category
  const visibleShops = useMemo(() => {
    return shops.filter(
      (s) => selectedCategory === 'All' || s.categories.includes(selectedCategory)
    );
  }, [shops, selectedCategory]);

  // Geometric collision offset algorithm: detects nearby coordinates and offsets slightly
  const positionedShops = useMemo(() => {
    const coordsSeen: { lat: number; lng: number }[] = [];
    return visibleShops.map((shop, idx) => {
      let lat = shop.lat;
      let lng = shop.lng;

      // Check if close to an already placed pin (< 0.002 deg ~ 200m)
      const collisionIdx = coordsSeen.findIndex(
        (c) => Math.abs(c.lat - lat) < 0.0022 && Math.abs(c.lng - lng) < 0.0022
      );

      if (collisionIdx !== -1) {
        // Offset by 24px equivalent in GPS degrees
        const angle = (idx * 60 * Math.PI) / 180;
        lat += 0.0018 * Math.sin(angle);
        lng += 0.0018 * Math.cos(angle);
      }

      coordsSeen.push({ lat, lng });
      return { shop, renderLat: lat, renderLng: lng };
    });
  }, [visibleShops]);

  return (
    <div className="relative w-full bg-[#EEF3EA] rounded-2xl border border-[#DDE5D9] overflow-hidden shadow-xs">
      {/* Search Header Overlay */}
      <div className="p-4 sm:p-5 bg-white border-b border-[#DDE5D9]">
        <div className="max-w-3xl mx-auto space-y-3">
          {/* Main Search Input */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#4E6057]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder={t('home.searchPlaceholder')}
              className="w-full pl-12 pr-20 py-3.5 bg-[#F7F9F4] border-2 border-[#DDE5D9] focus:border-[#0E3B2C] focus:bg-white rounded-xl text-base sm:text-lg text-[#14201B] placeholder:text-[#4E6057]/70 font-medium transition-all shadow-xs"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {searchQuery && (
                <button
                  onClick={() => handleQueryChange('')}
                  className="p-1 text-[#4E6057] hover:text-[#14201B]"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <VoiceSearchButton onTranscript={handleQueryChange} />
            </div>
          </div>

          {/* Quick suggestions */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 text-xs">
            <span className="text-[#4E6057] shrink-0 font-medium">
              {language === 'ta' ? 'விரைவு தேடல்:' : 'Try:'}
            </span>
            {quickPills.map((pill) => (
              <button
                key={pill}
                onClick={() => handleQueryChange(pill)}
                className="px-2.5 py-1 rounded-full bg-[#F7F9F4] hover:bg-[#EEF3EA] border border-[#DDE5D9] text-[#14201B] capitalize shrink-0 font-medium transition-colors"
              >
                {pill}
              </button>
            ))}
          </div>

          {/* Category Chips Bar */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
            {categories.map((cat) => {
              const active = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs sm:text-sm font-semibold shrink-0 transition-all ${
                    active
                      ? 'bg-[#0E3B2C] text-white shadow-xs'
                      : 'bg-[#F7F9F4] text-[#4E6057] hover:bg-[#EEF3EA] border border-[#DDE5D9]'
                  }`}
                >
                  <span>{cat.emoji}</span>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Active Product Banner & Legend */}
          {matchedProduct && (
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs sm:text-sm">
              <div className="flex items-center gap-2 text-[#0E3B2C] font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-[#1F6B4A]"></span>
                <span>
                  {language === 'ta' ? matchedProduct.nameTa || matchedProduct.name : matchedProduct.name}
                </span>
                <span className="text-[#4E6057] font-normal">
                  ({shopOffersMap.size} {language === 'ta' ? 'கடைகளில் கிடைக்கிறது' : 'shops found'})
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <span className="inline-flex items-center gap-1.5 text-[#14201B] font-bold">
                  <span className="w-3 h-3 rounded-full bg-[#FFB400] inline-block border border-white"></span>
                  {t('compare.cheapestBadge')}
                </span>
                <span className="inline-flex items-center gap-1.5 text-[#14201B] font-medium">
                  <span className="w-3 h-3 rounded-full bg-[#1F6B4A] inline-block"></span>
                  {t('compare.closestBadge')}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Map Container - min 360px mobile, 520px desktop */}
      <div className="relative w-full h-[380px] sm:h-[520px]">
        <MapContainer
          center={[userCoords.lat, userCoords.lng]}
          zoom={14}
          scrollWheelZoom={false}
          className="w-full h-full"
          ref={mapRef}
        >
          <MapController
            userLat={userCoords.lat}
            userLng={userCoords.lng}
            shops={visibleShops}
          />

          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* 1.8 km dashed radius ring around user */}
          <Circle
            center={[userCoords.lat, userCoords.lng]}
            radius={1800}
            pathOptions={{
              color: '#1F6B4A',
              fillColor: '#1F6B4A',
              fillOpacity: 0.05,
              weight: 1.5,
              dashArray: '5, 8',
            }}
          />

          {/* User Location Center Marker */}
          <Marker position={[userCoords.lat, userCoords.lng]} icon={userLocationIcon} />

          {/* Anchored Shop Offer Pins */}
          {positionedShops.map(({ shop, renderLat, renderLng }) => {
            const offerInfo = shopOffersMap.get(shop.id);
            const isCheapest = shop.id === cheapestShopId;
            const isClosest = shop.id === closestShopId && !isCheapest;
            const isSelected = shop.id === selectedShopId;
            const isOutOfStock = offerInfo ? offerInfo.offer.stock <= 0 : false;

            const distanceKm =
              offerInfo?.distanceKm ||
              calculateDistanceKm(userCoords.lat, userCoords.lng, shop.lat, shop.lng);
            const distText = formatDistance(distanceKm);

            // Construct accessible label
            const accessibleLabel = offerInfo
              ? `${shop.name}, ${matchedProduct?.name || 'Item'} ${formatCurrency(offerInfo.offer.price)}, ${distText} away`
              : `${shop.name}, Rating ${shop.rating}, ${distText} away`;

            // State classes
            let anchorClasses = 'map-pin-anchor';
            if (isCheapest) anchorClasses += ' cheapest pulse-marigold';
            else if (isClosest) anchorClasses += ' closest';
            if (isSelected) anchorClasses += ' selected';
            if (isOutOfStock) anchorClasses += ' out-of-stock';

            // HTML content with pill + downward tail + dot anchor
            let pillContentHtml = '';
            if (offerInfo) {
              pillContentHtml = `
                <div class="map-pin-pill">
                  <div class="price-line">${isCheapest ? '★ ' : ''}${formatCurrency(offerInfo.offer.price)}</div>
                  <div class="meta-line">${shop.shortName} · ${distText}</div>
                </div>
              `;
            } else {
              pillContentHtml = `
                <div class="map-pin-pill">
                  <div class="price-line" style="font-size: 13px;">★ ${shop.rating.toFixed(1)}</div>
                  <div class="meta-line">${shop.shortName} · ${distText}</div>
                </div>
              `;
            }

            const pinHtml = `
              <div class="${anchorClasses}" tabindex="0" role="button" aria-label="${accessibleLabel}">
                ${pillContentHtml}
                <div class="map-pin-tail"></div>
                <div class="map-pin-dot"></div>
              </div>
            `;

            const anchoredIcon = L.divIcon({
              className: '',
              html: pinHtml,
              iconSize: [0, 0],
              iconAnchor: [0, 0],
            });

            return (
              <Marker
                key={shop.id}
                position={[renderLat, renderLng]}
                icon={anchoredIcon}
                eventHandlers={{
                  click: () => setSelectedShopId(shop.id),
                }}
              />
            );
          })}
        </MapContainer>

        {/* Floating Map Controls: Recenter, Zoom In/Out (Touch target >= 44px) */}
        <div className="absolute top-4 right-4 z-30 flex flex-col gap-2">
          <button
            onClick={handleRecenter}
            className="w-11 h-11 bg-white rounded-xl shadow-md border border-[#DDE5D9] flex items-center justify-center text-[#0E3B2C] hover:bg-[#EEF3EA] active:scale-95 transition-all"
            title="Recenter to my location"
            aria-label="Recenter to my location"
          >
            <LocateFixed className="w-5 h-5" />
          </button>

          <button
            onClick={() => handleZoom(1)}
            className="w-11 h-11 bg-white rounded-xl shadow-md border border-[#DDE5D9] flex items-center justify-center text-[#14201B] hover:bg-[#EEF3EA] active:scale-95 transition-all"
            title="Zoom In"
            aria-label="Zoom in"
          >
            <ZoomIn className="w-5 h-5" />
          </button>

          <button
            onClick={() => handleZoom(-1)}
            className="w-11 h-11 bg-white rounded-xl shadow-md border border-[#DDE5D9] flex items-center justify-center text-[#14201B] hover:bg-[#EEF3EA] active:scale-95 transition-all"
            title="Zoom Out"
            aria-label="Zoom out"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
        </div>

        {/* Floating Bottom Sheet for Selected Shop */}
        {activeShopData && (
          <div className="absolute bottom-4 left-4 right-4 sm:left-6 sm:right-auto sm:w-96 z-30 bg-white rounded-2xl p-4 sm:p-5 border-2 border-[#0E3B2C] shadow-xl animate-in slide-in-from-bottom duration-200">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h3 className="font-display font-bold text-base sm:text-lg text-[#14201B]">
                    {language === 'ta' ? activeShopData.shop.nameTa || activeShopData.shop.name : activeShopData.shop.name}
                  </h3>
                  {activeShopData.shop.verified && (
                    <span title="Verified Pollachi Store">
                      <ShieldCheck className="w-4 h-4 text-[#1F6B4A]" />
                    </span>
                  )}
                  {activeShopData.isCheapest && (
                    <Badge variant="marigold" size="sm">
                      {t('compare.cheapestBadge')}
                    </Badge>
                  )}
                  {activeShopData.isClosest && (
                    <Badge variant="grove" size="sm">
                      {t('compare.closestBadge')}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-[#4E6057] line-clamp-1 mt-0.5">
                  {activeShopData.shop.address}
                </p>
              </div>

              <button
                onClick={() => setSelectedShopId(null)}
                className="p-1 rounded-full text-[#4E6057] hover:bg-[#EEF3EA]"
                aria-label="Close sheet"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Shop Metrics */}
            <div className="flex items-center gap-3 text-xs text-[#4E6057] py-2 border-y border-[#DDE5D9] my-2">
              <span className="flex items-center gap-1 font-semibold text-[#14201B]">
                <Star className="w-3.5 h-3.5 fill-[#FFB400] text-[#FFB400]" />
                {activeShopData.shop.rating} ({activeShopData.shop.reviewCount})
              </span>
              <span>•</span>
              <span className="font-medium text-[#0E3B2C]">
                {formatDistance(activeShopData.distanceKm)} {t('common.away')}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#1F6B4A]" />
                {formatEstTime(activeShopData.offer?.deliveryEstMins, 'delivery')}
              </span>
            </div>

            {/* Simulated Stock Confidence Badge */}
            <div className="flex items-center justify-between text-[11px] text-[#4E6057] bg-[#EEF3EA] px-2.5 py-1 rounded-lg mb-2">
              <span className="font-medium text-[#0E3B2C]">
                📷 Live from shelf camera (2 min ago)
              </span>
              <span className="text-[10px] font-semibold text-[#1F6B4A] uppercase">
                Simulated demo
              </span>
            </div>

            {/* Offer Details if present */}
            {activeShopData.offer && matchedProduct ? (
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-[#4E6057]">
                      {matchedProduct.name}
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="font-display font-extrabold text-2xl text-[#0E3B2C]">
                        {formatCurrency(activeShopData.offer.price)}
                      </span>
                      {activeShopData.offer.mrp && activeShopData.offer.mrp > activeShopData.offer.price && (
                        <span className="text-xs text-[#4E6057] line-through">
                          {formatCurrency(activeShopData.offer.mrp)}
                        </span>
                      )}
                    </div>
                  </div>

                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      activeShopData.offer.stock < 5
                        ? 'bg-[#D63A2F]/10 text-[#D63A2F]'
                        : 'bg-[#EEF3EA] text-[#0E3B2C]'
                    }`}
                  >
                    {activeShopData.offer.stock} {t('compare.inStock')}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Button
                    variant={activeShopData.isCheapest ? 'marigold' : 'palm'}
                    size="sm"
                    fullWidth
                    onClick={() => handleAddToCart(activeShopData.offer!, activeShopData.shop)}
                  >
                    <ShoppingBag className="w-4 h-4 mr-1.5" />
                    <span>
                      {addedOfferId === activeShopData.offer.id
                        ? t('common.added')
                        : t('common.addToCart')}
                    </span>
                  </Button>

                  <Link
                    to={`/compare?productId=${matchedProduct.id}`}
                    className="inline-flex items-center justify-center text-xs sm:text-sm font-semibold rounded-lg border border-[#BDCBB8] text-[#0E3B2C] bg-white hover:bg-[#EEF3EA] px-3 py-2 min-h-[38px] transition-colors"
                  >
                    <span>{t('common.viewOffers')}</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="pt-2 flex items-center justify-between">
                <Link
                  to={`/shop/${activeShopData.shop.id}`}
                  className="text-xs font-semibold text-[#0E3B2C] hover:underline flex items-center gap-1"
                >
                  <Store className="w-3.5 h-3.5" />
                  <span>{language === 'ta' ? 'கடை விவரங்களைக் காண்க' : 'View Shop Catalog'}</span>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
