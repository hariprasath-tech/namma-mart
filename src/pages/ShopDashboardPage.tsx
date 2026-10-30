import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { Shop, Product, Offer, Order, Expense, KhataEntry, Supplier } from '../types';
import { formatCurrency, formatDate } from '../lib/format';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import {
  Store,
  LayoutDashboard,
  Package,
  Layers,
  Wallet,
  BookOpen,
  LineChart,
  Scan,
  Users,
  MessageSquare,
  Settings,
  Plus,
  RefreshCw,
  MapPin,
  CheckCircle2,
  Phone,
  Truck,
  X,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useLangStore } from '../store/lang';
import { useTranslation } from 'react-i18next';

// Tab Components
import { OwnerOverviewTab } from '../components/shop/OwnerOverviewTab';
import { OwnerStockTab } from '../components/shop/OwnerStockTab';
import { OwnerMoneyTab } from '../components/shop/OwnerMoneyTab';
import { OwnerKhataTab } from '../components/shop/OwnerKhataTab';
import { OwnerInsightsTab } from '../components/shop/OwnerInsightsTab';
import { OwnerSmartShelfTab } from '../components/shop/OwnerSmartShelfTab';
import { OwnerCrowdTab } from '../components/shop/OwnerCrowdTab';
import { OwnerRequestsTab } from '../components/shop/OwnerRequestsTab';
import { OwnerSettingsTab } from '../components/shop/OwnerSettingsTab';

export type ShopTabId =
  | 'overview'
  | 'orders'
  | 'stock'
  | 'money'
  | 'khata'
  | 'insights'
  | 'smart-shelf'
  | 'crowd'
  | 'requests'
  | 'settings';

export const ShopDashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const { language } = useLangStore();
  const navigate = useNavigate();

  const [shops, setShops] = useState<Shop[]>([]);
  const [currentShopId, setCurrentShopId] = useState<string>('shop-1');
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [khataEntries, setKhataEntries] = useState<KhataEntry[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<ShopTabId>('overview');

  // Add Product modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('Grocery');
  const [newProdUnit, setNewProdUnit] = useState('1 kg');
  const [newProdPrice, setNewProdPrice] = useState('50');
  const [newProdStock, setNewProdStock] = useState('20');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [
        allShops,
        allProds,
        allOffers,
        allOrders,
        allExpenses,
        allKhata,
        allSuppliers,
      ] = await Promise.all([
        api.getShops(),
        api.getProducts(),
        api.getOffers(),
        api.getOrders(),
        api.getExpenses(),
        api.getKhata(),
        api.getSuppliers(),
      ]);
      setShops(allShops);
      setProducts(allProds);
      setOffers(allOffers);
      setOrders(allOrders);
      setExpenses(allExpenses);
      setKhataEntries(allKhata);
      setSuppliers(allSuppliers);
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
  const shopOrders = orders.filter((o) => o.shopId === currentShopId);
  const shopOffers = offers.filter((o) => o.shopId === currentShopId);
  const shopExpenses = expenses.filter((e) => e.shopId === currentShopId);
  const shopKhata = khataEntries.filter((k) => k.shopId === currentShopId);

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

  // Add expense mutation
  const handleAddExpense = async (data: Omit<Expense, 'id'>) => {
    try {
      const created = await api.addExpense(data);
      setExpenses((prev) => [created, ...prev]);
    } catch (e) {
      console.error(e);
    }
  };

  // Add khata entry mutation
  const handleAddKhata = async (data: Omit<KhataEntry, 'id'>) => {
    try {
      const created = await api.addKhataEntry(data);
      setKhataEntries((prev) => [created, ...prev]);
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

  if (loading || !currentShop) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-[#4E6057]">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#0E3B2C] mb-3" />
        <p>Loading merchant dashboard...</p>
      </div>
    );
  }

  const pendingOrdersCount = shopOrders.filter(
    (o) => o.status === 'packed' || o.status === 'ready_for_pickup'
  ).length;
  const lowStockCount = shopOffers.filter((o) => o.stock < 5).length;

  const tabItems: { id: ShopTabId; label: string; icon: any; badge?: number | string; chip?: string }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'orders', label: 'Orders', icon: Package, badge: pendingOrdersCount > 0 ? pendingOrdersCount : undefined },
    { id: 'stock', label: 'Stock & Inventory', icon: Layers, badge: lowStockCount > 0 ? `${lowStockCount} low` : undefined },
    { id: 'money', label: 'Money & Spend', icon: Wallet },
    { id: 'khata', label: 'Khata Credit', icon: BookOpen },
    { id: 'insights', label: 'Insights & Demand', icon: LineChart },
    { id: 'smart-shelf', label: 'Smart Shelf', icon: Scan, chip: 'Simulated' },
    { id: 'crowd', label: 'Crowd & Queues', icon: Users, chip: 'Simulated' },
    { id: 'requests', label: 'Customer Requests', icon: MessageSquare },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-5">
      {/* Top Shop Banner & Merchant Switcher */}
      <div className="bg-[#0E3B2C] text-white rounded-2xl p-5 sm:p-6 shadow-md border border-[#1F6B4A]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-[#FFB400] shrink-0">
              <Store className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display font-bold text-2xl sm:text-3xl tracking-tight">
                  {language === 'ta' ? currentShop.nameTa || currentShop.name : currentShop.name}
                </h1>
                <Badge variant="grove" size="sm" className="bg-[#1F6B4A] text-white border border-white/20">
                  🟢 {t('common.open')}
                </Badge>
                {currentShop.type === 'department' && (
                  <Badge variant="marigold" size="sm" className="font-bold">
                    Department Store Mode
                  </Badge>
                )}
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/20 text-white">
                  TRL 3 Demo
                </span>
              </div>
              <p className="text-xs sm:text-sm text-white/80 flex items-center gap-1.5 mt-1">
                <MapPin className="w-3.5 h-3.5 text-[#FFB400]" />
                {currentShop.address} · Pollachi
              </p>
            </div>
          </div>

          {/* Quick Controls: Merchant Switcher & Add Product */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-xl border border-white/15">
              <label htmlFor="shop-select" className="text-xs font-semibold text-white/80 shrink-0">
                Store:
              </label>
              <select
                id="shop-select"
                value={currentShopId}
                onChange={(e) => setCurrentShopId(e.target.value)}
                className="bg-transparent text-xs sm:text-sm font-bold text-[#FFB400] focus:outline-hidden cursor-pointer"
              >
                {shops.map((s) => (
                  <option key={s.id} value={s.id} className="text-[#14201B]">
                    {s.name} ({s.type === 'department' ? 'Dept Store' : s.area})
                  </option>
                ))}
              </select>
            </div>

            <Button
              variant="marigold"
              size="sm"
              onClick={() => setShowAddModal(true)}
              className="font-bold text-xs"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              <span>{t('shopDashboard.addProduct')}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Layout: Sidebar on Desktop, Horizontal Tabs on Mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Desktop Sidebar (1 col) / Mobile Tab Strip */}
        <div className="lg:col-span-1">
          {/* Mobile Horizontal Scrollable Tab Bar */}
          <div className="lg:hidden flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
            {tabItems.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border shrink-0 ${
                    isActive
                      ? 'bg-[#0E3B2C] text-[#FFB400] border-[#0E3B2C] shadow-sm'
                      : 'bg-white text-[#4E6057] border-[#DDE5D9] hover:bg-[#EEF3EA]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#D63A2F] text-white">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Desktop Left Nav Sidebar */}
          <div className="hidden lg:block bg-white rounded-2xl p-3 border border-[#DDE5D9] shadow-xs space-y-1 sticky top-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#4E6057] px-3 py-2 block">
              Store Operations
            </span>

            {tabItems.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-[#0E3B2C] text-[#FFB400] shadow-xs'
                      : 'text-[#4E6057] hover:bg-[#EEF3EA] hover:text-[#0E3B2C]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#FFB400]' : 'text-[#4E6057]'}`} />
                    <span>{tab.label}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {tab.chip && (
                      <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-[#FFB400]/20 text-[#FFB400]">
                        {tab.chip}
                      </span>
                    )}
                    {tab.badge && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-[#D63A2F] text-white font-bold">
                        {tab.badge}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}

            <div className="pt-4 mt-4 border-t border-[#DDE5D9] px-2 text-[11px] text-[#4E6057]">
              <p className="font-semibold text-[#14201B]">Pollachi Hyperlocal Hub</p>
              <p className="text-[10px] text-[#4E6057] mt-0.5">TRL 3 Research Prototype</p>
            </div>
          </div>
        </div>

        {/* Tab Content Canvas (4 cols) */}
        <div className="lg:col-span-4 min-w-0">
          {/* Tab 1: Overview */}
          {activeTab === 'overview' && (
            <OwnerOverviewTab
              shop={currentShop}
              orders={shopOrders}
              offers={shopOffers}
              products={products}
              onNavigateTab={(tab) => setActiveTab(tab as ShopTabId)}
              onOpenAddExpense={() => setActiveTab('money')}
            />
          )}

          {/* Tab 2: Orders Queue */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-white rounded-2xl p-5 border border-[#DDE5D9] shadow-xs">
                <div>
                  <h2 className="font-display font-bold text-lg text-[#14201B]">Customer Orders Queue</h2>
                  <p className="text-xs text-[#4E6057]">
                    Manage real-time customer pickup holds and delivery dispatches.
                  </p>
                </div>
                <Badge variant="grove" size="sm">
                  {shopOrders.length} Total Orders
                </Badge>
              </div>

              {shopOrders.length === 0 ? (
                <div className="bg-white rounded-2xl p-10 text-center border border-[#DDE5D9] text-[#4E6057]">
                  <Package className="w-10 h-10 mx-auto mb-2 opacity-40 text-[#0E3B2C]" />
                  <p className="font-semibold">No pending orders for {currentShop.name} today.</p>
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

                    {/* Customer Info */}
                    <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-[#4E6057]">
                      <span className="font-semibold text-[#14201B]">👤 {ord.customerName}</span>
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-[#1F6B4A]" /> {ord.customerPhone}
                      </span>
                      {ord.deliveryAddress && (
                        <span className="flex items-center gap-1 text-[#0E3B2C]">
                          <MapPin className="w-3.5 h-3.5" /> {ord.deliveryAddress}
                        </span>
                      )}
                    </div>

                    {/* Items in order */}
                    <div className="bg-[#F7F9F4] rounded-xl p-3 border border-[#DDE5D9] space-y-1.5">
                      <span className="text-[11px] font-bold uppercase text-[#4E6057] block">
                        Items to Pack ({ord.items.length})
                      </span>
                      <div className="divide-y divide-[#DDE5D9] text-xs">
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

                    {/* Action buttons */}
                    <div className="flex flex-wrap items-center justify-end gap-3 pt-1">
                      {ord.status === 'packed' && (
                        <Button
                          variant="grove"
                          size="md"
                          onClick={() =>
                            handleOrderStatusChange(
                              ord.id,
                              ord.mode === 'delivery' ? 'out_for_delivery' : 'ready_for_pickup'
                            )
                          }
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

          {/* Tab 3: Stock Management */}
          {activeTab === 'stock' && (
            <OwnerStockTab
              shop={currentShop}
              offers={shopOffers}
              products={products}
              suppliers={suppliers}
              onUpdateStock={handleStockDelta}
              onUpdatePrice={handlePriceChange}
              onOpenAddModal={() => setShowAddModal(true)}
            />
          )}

          {/* Tab 4: Money (Spend & Profit) */}
          {activeTab === 'money' && (
            <OwnerMoneyTab
              shop={currentShop}
              expenses={shopExpenses}
              orders={shopOrders}
              onAddExpense={handleAddExpense}
            />
          )}

          {/* Tab 5: Khata Credit */}
          {activeTab === 'khata' && (
            <OwnerKhataTab
              shop={currentShop}
              khataEntries={shopKhata}
              onAddKhataEntry={handleAddKhata}
            />
          )}

          {/* Tab 6: Insights & Demand */}
          {activeTab === 'insights' && (
            <OwnerInsightsTab
              shop={currentShop}
              offers={shopOffers}
              products={products}
            />
          )}

          {/* Tab 7: Smart Shelf (CCTV Computer Vision) */}
          {activeTab === 'smart-shelf' && (
            <OwnerSmartShelfTab
              shop={currentShop}
              products={products}
              offers={shopOffers}
              onNavigateToStock={() => setActiveTab('stock')}
              onNavigateToReorder={() => setActiveTab('stock')}
            />
          )}

          {/* Tab 8: Crowd & Queue Intelligence */}
          {activeTab === 'crowd' && (
            <OwnerCrowdTab
              shop={currentShop}
              onOpenDemo={() => navigate('/shop/crowd/demo')}
            />
          )}

          {/* Tab 9: Customer Requests ("Can't Find It?") */}
          {activeTab === 'requests' && (
            <OwnerRequestsTab shop={currentShop} />
          )}

          {/* Tab 10: Settings */}
          {activeTab === 'settings' && (
            <OwnerSettingsTab shop={currentShop} />
          )}
        </div>
      </div>

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
