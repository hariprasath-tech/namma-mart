import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Shop, Product, Offer, Order } from '../types';
import { formatCurrency, formatDate } from '../lib/format';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import {
  Store,
  Package,
  Plus,
  Minus,
  Search,
  AlertTriangle,
  TrendingUp,
  CheckCircle2,
  Clock,
  Phone,
  MapPin,
  Truck,
  X,
  RefreshCw,
} from 'lucide-react';
import { useLangStore } from '../store/lang';
import { useTranslation } from 'react-i18next';

export const ShopDashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const { language } = useLangStore();

  const [shops, setShops] = useState<Shop[]>([]);
  const [currentShopId, setCurrentShopId] = useState<string>('shop-1');
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'orders' | 'inventory' | 'profile'>('orders');

  const [inventorySearch, setInventorySearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // New product form
  const [newProdName, setNewProdName] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('Grocery');
  const [newProdUnit, setNewProdUnit] = useState('1 kg');
  const [newProdPrice, setNewProdPrice] = useState('50');
  const [newProdStock, setNewProdStock] = useState('20');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allShops, allProds, allOffers, allOrders] = await Promise.all([
        api.getShops(),
        api.getProducts(),
        api.getOffers(),
        api.getOrders(),
      ]);
      setShops(allShops);
      setProducts(allProds);
      setOffers(allOffers);
      setOrders(allOrders);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const currentShop = shops.find((s) => s.id === currentShopId) || shops[0];

  // Filter orders for this shop
  const shopOrders = orders.filter((o) => o.shopId === currentShopId);

  // Filter offers and products for this shop
  const shopOffers = offers.filter((o) => o.shopId === currentShopId);

  // Quick stock mutation
  const handleStockDelta = async (offerId: string, currentStock: number, delta: number) => {
    const nextStock = Math.max(0, currentStock + delta);
    try {
      const updated = await api.updateOfferStock(offerId, nextStock);
      setOffers((prev) => prev.map((o) => (o.id === offerId ? updated : o)));
    } catch (e) {
      console.error(e);
    }
  };

  // Price mutation
  const handlePriceChange = async (offerId: string, newPrice: number) => {
    if (newPrice <= 0) return;
    try {
      const updated = await api.updateOfferPrice(offerId, newPrice);
      setOffers((prev) => prev.map((o) => (o.id === offerId ? updated : o)));
    } catch (e) {
      console.error(e);
    }
  };

  // Order status update
  const handleOrderStatusChange = async (orderId: string, status: any) => {
    try {
      const updated = await api.updateOrderStatus(orderId, status);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
    } catch (e) {
      console.error(e);
    }
  };

  // Create new product
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim() || !newProdPrice) return;
    setIsSubmitting(true);
    try {
      const { product, offer } = await api.createProductAndOffer(
        {
          name: newProdName.trim(),
          category: newProdCategory,
          unit: newProdUnit,
          image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80',
          description: `Fresh quality ${newProdName} stocked at local Pollachi store.`,
        },
        {
          shopId: currentShopId,
          price: Number(newProdPrice),
          stock: Number(newProdStock) || 10,
          mrp: Number(newProdPrice) + 5,
        }
      );
      setProducts((prev) => [product, ...prev]);
      setOffers((prev) => [offer, ...prev]);
      setShowAddModal(false);
      setNewProdName('');
      setNewProdPrice('50');
      setNewProdStock('20');
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Summary Metrics
  const pendingOrdersCount = shopOrders.filter((o) => o.status === 'packed' || o.status === 'ready_for_pickup').length;
  const lowStockCount = shopOffers.filter((o) => o.stock < 5).length;
  const estSalesToday = shopOrders.reduce((sum, o) => sum + o.totalAmount, 0) + 3800;

  if (loading || !currentShop) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center text-[#4E6057]">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#0E3B2C] mb-3" />
        <p>Loading shop dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Shop Banner & Shop Switcher */}
      <div className="bg-[#0E3B2C] text-white rounded-2xl p-6 shadow-md border border-[#1F6B4A]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-[#FFB400] shrink-0">
              <Store className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display font-bold text-2xl sm:text-3xl tracking-tight">
                  {language === 'ta' ? currentShop.nameTa || currentShop.name : currentShop.name}
                </h1>
                <Badge variant="grove" size="sm" className="bg-[#1F6B4A] text-white border border-white/20">
                  🟢 {t('common.open')}
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-white/80 flex items-center gap-1.5 mt-1">
                <MapPin className="w-3.5 h-3.5 text-[#FFB400]" />
                {currentShop.address}
              </p>
            </div>
          </div>

          {/* Switch Shop Dropdown for easy pair-testing */}
          <div className="flex items-center gap-2 bg-white/10 px-3.5 py-2 rounded-xl border border-white/15">
            <label htmlFor="shop-select" className="text-xs font-semibold text-white/80 shrink-0">
              {language === 'ta' ? 'கடையை மாற்ற:' : 'Merchant:'}
            </label>
            <select
              id="shop-select"
              value={currentShopId}
              onChange={(e) => setCurrentShopId(e.target.value)}
              className="bg-transparent text-sm font-bold text-[#FFB400] focus:outline-hidden cursor-pointer"
            >
              {shops.map((s) => (
                <option key={s.id} value={s.id} className="text-[#14201B]">
                  {s.name} ({s.area})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 3 Overview Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/15">
          <div className="bg-white/10 rounded-xl p-4 border border-white/10">
            <span className="text-xs text-white/70 block uppercase font-medium">
              {t('shopDashboard.ordersQueue')}
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-display text-3xl font-extrabold text-[#FFB400]">
                {shopOrders.length}
              </span>
              <span className="text-xs text-white/80">
                ({pendingOrdersCount} {language === 'ta' ? 'பேக் செய்யப்பட வேண்டும்' : 'need packing'})
              </span>
            </div>
          </div>

          <div className="bg-white/10 rounded-xl p-4 border border-white/10">
            <span className="text-xs text-white/70 block uppercase font-medium">
              {t('shopDashboard.earningsSummary')}
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-display text-3xl font-extrabold text-white">
                {formatCurrency(estSalesToday)}
              </span>
              <span className="text-xs text-[#FFB400]">
                {language === 'ta' ? 'இன்றைய விற்பனை' : 'Today (Est.)'}
              </span>
            </div>
          </div>

          <div className="bg-white/10 rounded-xl p-4 border border-white/10">
            <span className="text-xs text-white/70 block uppercase font-medium">
              {t('shopDashboard.lowStockAlert')}
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span
                className={`font-display text-3xl font-extrabold ${
                  lowStockCount > 0 ? 'text-[#FFB400]' : 'text-white'
                }`}
              >
                {lowStockCount}
              </span>
              <span className="text-xs text-white/80">
                {language === 'ta' ? 'பொருட்கள் குறைந்திருப்பில்' : 'items < 5 units'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#DDE5D9] pb-1">
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-2 px-5 py-3 rounded-t-xl text-base font-bold transition-all ${
            activeTab === 'orders'
              ? 'bg-white border-t-2 border-x border-[#0E3B2C] text-[#0E3B2C] -mb-1.5'
              : 'text-[#4E6057] hover:text-[#0E3B2C]'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>{t('shopDashboard.ordersQueue')} ({shopOrders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex items-center gap-2 px-5 py-3 rounded-t-xl text-base font-bold transition-all ${
            activeTab === 'inventory'
              ? 'bg-white border-t-2 border-x border-[#0E3B2C] text-[#0E3B2C] -mb-1.5'
              : 'text-[#4E6057] hover:text-[#0E3B2C]'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>{t('shopDashboard.productManager')} ({shopOffers.length})</span>
        </button>
      </div>

      {/* Tab 1: Orders Queue */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {shopOrders.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-[#DDE5D9]">
              <Package className="w-10 h-10 text-[#4E6057] mx-auto mb-2 opacity-50" />
              <p className="text-base text-[#4E6057]">
                {language === 'ta' ? 'இன்று புதிய ஆர்டர்கள் எதுவும் இல்லை.' : 'No orders pending today.'}
              </p>
            </div>
          ) : (
            shopOrders.map((ord) => (
              <div
                key={ord.id}
                className="bg-white rounded-2xl p-5 sm:p-6 border border-[#DDE5D9] shadow-xs space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#DDE5D9] pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-display font-extrabold text-lg text-[#0E3B2C]">
                        Order #{ord.id}
                      </span>
                      <Badge
                        variant={ord.status === 'delivered' || ord.status === 'picked_up' ? 'grove' : 'subtle'}
                        size="sm"
                      >
                        {ord.status.toUpperCase()}
                      </Badge>
                      <Badge variant={ord.mode === 'delivery' ? 'palm' : 'outline'} size="sm">
                        {ord.mode === 'delivery' ? (
                          <span className="flex items-center gap-1">
                            <Truck className="w-3 h-3" /> Home Delivery
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <Store className="w-3 h-3" /> Store Pickup
                          </span>
                        )}
                      </Badge>
                    </div>
                    <span className="text-xs text-[#4E6057] mt-0.5 block">
                      {formatDate(ord.createdAt)} · Paid via {ord.payment.toUpperCase()}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="font-display font-bold text-xl text-[#14201B]">
                      {formatCurrency(ord.totalAmount)}
                    </span>
                    <span className="text-xs text-[#1F6B4A] block font-medium">
                      {ord.paymentStatus === 'paid' ? 'Payment Confirmed' : 'Payment on Delivery'}
                    </span>
                  </div>
                </div>

                {/* Customer Details */}
                <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-[#4E6057]">
                  <span className="font-semibold text-[#14201B]">
                    👤 {ord.customerName}
                  </span>
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-[#1F6B4A]" />
                    {ord.customerPhone}
                  </span>
                  {ord.deliveryAddress && (
                    <span className="flex items-center gap-1 text-[#0E3B2C]">
                      <MapPin className="w-3.5 h-3.5" />
                      {ord.deliveryAddress}
                    </span>
                  )}
                </div>

                {/* Items in this order */}
                <div className="bg-[#F7F9F4] rounded-xl p-3 border border-[#DDE5D9] space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#4E6057]">
                    Items to Pack ({ord.items.length})
                  </span>
                  <div className="divide-y divide-[#DDE5D9] text-xs sm:text-sm">
                    {ord.items.map((it, idx) => (
                      <div key={idx} className="py-1.5 flex items-center justify-between">
                        <span className="font-medium text-[#14201B]">
                          {it.qty}x {it.name}
                        </span>
                        <span className="font-semibold text-[#0E3B2C]">
                          {formatCurrency(it.price * it.qty)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Packing & Dispatch Action Buttons */}
                <div className="flex flex-wrap items-center justify-end gap-3 pt-1">
                  {ord.status === 'packed' && (
                    <Button
                      variant="grove"
                      size="md"
                      onClick={() => handleOrderStatusChange(ord.id, ord.mode === 'delivery' ? 'out_for_delivery' : 'ready_for_pickup')}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      <span>{ord.mode === 'delivery' ? 'Dispatch for Delivery' : 'Mark Ready for Pickup'}</span>
                    </Button>
                  )}

                  {ord.status === 'out_for_delivery' && (
                    <Button
                      variant="palm"
                      size="md"
                      onClick={() => handleOrderStatusChange(ord.id, 'delivered')}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      <span>Mark Delivered</span>
                    </Button>
                  )}

                  {ord.status === 'ready_for_pickup' && (
                    <Button
                      variant="palm"
                      size="md"
                      onClick={() => handleOrderStatusChange(ord.id, 'picked_up')}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      <span>Mark Picked Up by Customer</span>
                    </Button>
                  )}

                  {(ord.status === 'delivered' || ord.status === 'picked_up') && (
                    <span className="text-xs font-bold text-[#1F6B4A] flex items-center gap-1.5 py-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Order Completed
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Product Manager & Quick Stock [ - ] [ + ] */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#DDE5D9] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-[#4E6057] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={language === 'ta' ? 'சரக்கு தேடல்...' : 'Filter store items...'}
                value={inventorySearch}
                onChange={(e) => setInventorySearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#F7F9F4] border border-[#BDCBB8] rounded-xl text-sm focus:outline-[#0E3B2C]"
              />
            </div>

            <Button
              variant="palm"
              size="md"
              onClick={() => setShowAddModal(true)}
              className="w-full sm:w-auto"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              <span>{t('shopDashboard.addProduct')}</span>
            </Button>
          </div>

          {/* Product Items Table / Rows */}
          <div className="space-y-3">
            {shopOffers
              .filter((off) => {
                const prod = products.find((p) => p.id === off.productId);
                if (!prod) return false;
                if (!inventorySearch) return true;
                return prod.name.toLowerCase().includes(inventorySearch.toLowerCase());
              })
              .map((off) => {
                const prod = products.find((p) => p.id === off.productId);
                if (!prod) return null;

                const isLowStock = off.stock < 5;

                return (
                  <div
                    key={off.id}
                    className={`bg-white rounded-2xl p-4 sm:p-5 border-2 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs ${
                      isLowStock ? 'border-[#D63A2F]/50 bg-[#FFFBFB]' : 'border-[#DDE5D9]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={prod.image}
                        alt={prod.name}
                        className="w-14 h-14 rounded-xl object-cover border border-[#DDE5D9] bg-[#F7F9F4] shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#EEF3EA] text-[#0E3B2C]">
                            {prod.category}
                          </span>
                          {isLowStock && (
                            <Badge variant="chilli" size="sm" className="font-bold">
                              ⚠️ {t('shopDashboard.lowStockAlert')} ({off.stock})
                            </Badge>
                          )}
                        </div>
                        <h3 className="font-display font-bold text-base sm:text-lg text-[#14201B] mt-0.5">
                          {language === 'ta' ? prod.nameTa || prod.name : prod.name}
                        </h3>
                        <span className="text-xs text-[#4E6057]">{prod.unit}</span>
                      </div>
                    </div>

                    {/* Price and Stock Controls */}
                    <div className="flex items-center gap-6 self-end md:self-center">
                      {/* Price Control */}
                      <div className="flex flex-col items-center">
                        <span className="text-xs text-[#4E6057] font-semibold mb-1">
                          {language === 'ta' ? 'விலை (₹)' : 'Price (₹)'}
                        </span>
                        <div className="flex items-center gap-1 bg-[#F7F9F4] border border-[#BDCBB8] rounded-xl px-2.5 py-1">
                          <span className="text-sm font-bold text-[#0E3B2C]">₹</span>
                          <input
                            type="number"
                            value={off.price}
                            onChange={(e) => handlePriceChange(off.id, Number(e.target.value))}
                            className="w-16 bg-transparent font-display font-extrabold text-lg text-[#14201B] text-center focus:outline-hidden"
                            min="1"
                          />
                        </div>
                      </div>

                      {/* Stock Quick +/- Controls (Fat 44px buttons for ease of use) */}
                      <div className="flex flex-col items-center">
                        <span className="text-xs text-[#4E6057] font-semibold mb-1">
                          {language === 'ta' ? 'இருப்பு எண்ணிக்கை' : 'Stock Units'}
                        </span>
                        <div className="flex items-center gap-2 bg-[#F7F9F4] p-1 rounded-xl border border-[#BDCBB8]">
                          <button
                            onClick={() => handleStockDelta(off.id, off.stock, -1)}
                            className="w-10 h-10 rounded-lg bg-white border border-[#DDE5D9] hover:bg-[#EEF3EA] flex items-center justify-center text-[#14201B] font-bold active:scale-95 transition-transform"
                            aria-label="Decrease stock"
                          >
                            <Minus className="w-4 h-4" />
                          </button>

                          <span className="w-12 text-center font-display font-extrabold text-xl text-[#0E3B2C]">
                            {off.stock}
                          </span>

                          <button
                            onClick={() => handleStockDelta(off.id, off.stock, 1)}
                            className="w-10 h-10 rounded-lg bg-white border border-[#DDE5D9] hover:bg-[#EEF3EA] flex items-center justify-center text-[#14201B] font-bold active:scale-95 transition-transform"
                            aria-label="Increase stock"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[#DDE5D9] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#DDE5D9] bg-[#F7F9F4]">
              <h2 className="font-display font-bold text-lg text-[#14201B]">
                {t('shopDashboard.addProduct')}
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-full text-[#4E6057] hover:bg-[#EEF3EA]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-[#14201B] uppercase tracking-wider block mb-1">
                  Product Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Traditional Gingelly Oil (500ml)"
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F7F9F4] border border-[#BDCBB8] rounded-xl text-sm focus:outline-[#0E3B2C]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#14201B] uppercase tracking-wider block mb-1">
                    Category
                  </label>
                  <select
                    value={newProdCategory}
                    onChange={(e) => setNewProdCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#F7F9F4] border border-[#BDCBB8] rounded-xl text-sm focus:outline-[#0E3B2C]"
                  >
                    <option value="Grocery">Grocery</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Stationery">Stationery</option>
                    <option value="Hardware">Hardware</option>
                    <option value="Pharmacy">Pharmacy</option>
                    <option value="Fashion">Fashion</option>
                    <option value="Home needs">Home needs</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#14201B] uppercase tracking-wider block mb-1">
                    Unit / Size
                  </label>
                  <input
                    type="text"
                    value={newProdUnit}
                    onChange={(e) => setNewProdUnit(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#F7F9F4] border border-[#BDCBB8] rounded-xl text-sm focus:outline-[#0E3B2C]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#14201B] uppercase tracking-wider block mb-1">
                    Selling Price (₹)
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#F7F9F4] border border-[#BDCBB8] rounded-xl text-sm focus:outline-[#0E3B2C]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#14201B] uppercase tracking-wider block mb-1">
                    Initial Stock
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={newProdStock}
                    onChange={(e) => setNewProdStock(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#F7F9F4] border border-[#BDCBB8] rounded-xl text-sm focus:outline-[#0E3B2C]"
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="palm"
                  size="md"
                  fullWidth
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : t('shopDashboard.saveProduct')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
