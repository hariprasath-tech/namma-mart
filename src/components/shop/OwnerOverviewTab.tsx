import React from 'react';
import { Shop, Order, Offer, Product, StockItem } from '../../types';
import { formatCurrency } from '../../lib/format';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  TrendingUp,
  Package,
  AlertTriangle,
  Clock,
  Sparkles,
  ArrowRight,
  PlusCircle,
  CheckCircle2,
  Users,
  Calendar,
  Wallet,
} from 'lucide-react';
import { classifyCrowdLevel } from '../../lib/classifiers';

interface OwnerOverviewTabProps {
  shop: Shop;
  orders: Order[];
  offers: Offer[];
  products: Product[];
  onNavigateTab: (tabId: string) => void;
  onOpenAddExpense: () => void;
}

export const OwnerOverviewTab: React.FC<OwnerOverviewTabProps> = ({
  shop,
  orders,
  offers,
  products,
  onNavigateTab,
  onOpenAddExpense,
}) => {
  const pendingOrders = orders.filter(
    (o) => o.status === 'packed' || o.status === 'ready_for_pickup'
  );

  const lowStockOffers = offers.filter((o) => o.stock < 5);
  const totalSalesToday = orders.reduce((sum, o) => sum + o.totalAmount, 0) + 4200;
  const cashSales = Math.round(totalSalesToday * 0.35);
  const upiSales = totalSalesToday - cashSales;

  // Crowd level for this store (simulated)
  const crowdLevel = classifyCrowdLevel(shop.type === 'department' ? 48 : 18);

  return (
    <div className="space-y-6">
      {/* Simulation Chip */}
      <div className="flex items-center justify-between bg-[#EEF3EA] border border-[#BDCBB8] px-4 py-2.5 rounded-xl text-xs text-[#0E3B2C]">
        <div className="flex items-center gap-2">
          <Badge variant="subtle" size="sm" className="bg-[#1F6B4A] text-white">
            Simulated demo
          </Badge>
          <span className="font-medium">
            Live store metrics and AI insights generated from real-time Pollachi town simulation.
          </span>
        </div>
        <span className="font-mono text-[11px] text-[#4E6057]">TRL 3 Prototype</span>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Sales */}
        <div className="bg-white rounded-2xl p-5 border border-[#DDE5D9] shadow-xs">
          <div className="flex items-center justify-between text-[#4E6057] text-xs font-semibold uppercase tracking-wider">
            <span>Today's Sales</span>
            <TrendingUp className="w-4 h-4 text-[#1F6B4A]" />
          </div>
          <div className="mt-2">
            <span className="font-display font-extrabold text-3xl text-[#0E3B2C]">
              {formatCurrency(totalSalesToday)}
            </span>
            <span className="text-xs text-[#1F6B4A] font-semibold block mt-1">
              ▲ 14% vs yesterday
            </span>
          </div>
        </div>

        {/* Orders Queue */}
        <div
          onClick={() => onNavigateTab('orders')}
          className="bg-white rounded-2xl p-5 border border-[#DDE5D9] shadow-xs hover:border-[#0E3B2C] cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between text-[#4E6057] text-xs font-semibold uppercase tracking-wider">
            <span>Orders Today</span>
            <Package className="w-4 h-4 text-[#0E3B2C]" />
          </div>
          <div className="mt-2">
            <span className="font-display font-extrabold text-3xl text-[#14201B]">
              {orders.length + 8}
            </span>
            <span className="text-xs text-[#FFB400] font-bold block mt-1">
              {pendingOrders.length + 2} pending packing
            </span>
          </div>
        </div>

        {/* Cash vs UPI split */}
        <div
          onClick={() => onNavigateTab('money')}
          className="bg-white rounded-2xl p-5 border border-[#DDE5D9] shadow-xs hover:border-[#0E3B2C] cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between text-[#4E6057] text-xs font-semibold uppercase tracking-wider">
            <span>Cash / UPI Split</span>
            <Wallet className="w-4 h-4 text-[#1F6B4A]" />
          </div>
          <div className="mt-2 text-xs space-y-1">
            <div className="flex justify-between font-bold text-[#14201B]">
              <span>Cash:</span>
              <span>{formatCurrency(cashSales)}</span>
            </div>
            <div className="flex justify-between font-bold text-[#0E3B2C]">
              <span>UPI:</span>
              <span>{formatCurrency(upiSales)}</span>
            </div>
          </div>
        </div>

        {/* Low Stock & Expiring */}
        <div
          onClick={() => onNavigateTab('stock')}
          className="bg-white rounded-2xl p-5 border border-[#DDE5D9] shadow-xs hover:border-[#0E3B2C] cursor-pointer transition-colors"
        >
          <div className="flex items-center justify-between text-[#4E6057] text-xs font-semibold uppercase tracking-wider">
            <span>Inventory Alerts</span>
            <AlertTriangle className="w-4 h-4 text-[#D63A2F]" />
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-2">
              <span className="font-display font-extrabold text-3xl text-[#D63A2F]">
                {lowStockOffers.length || 3}
              </span>
              <span className="text-xs text-[#4E6057]">items &lt; 5 units</span>
            </div>
            <span className="text-[11px] text-[#FFB400] font-bold block mt-1">
              ⚠️ 2 items expiring in 7 days
            </span>
          </div>
        </div>
      </div>

      {/* Smart AI Action Alerts (Simulated Demo) */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border-2 border-[#1F6B4A]/30 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#FFB400]" />
            <h2 className="font-display font-bold text-lg text-[#14201B]">
              Smart Predictive Alerts
            </h2>
          </div>
          <Badge variant="subtle" size="sm">
            Forecast Engine
          </Badge>
        </div>

        <div className="space-y-3">
          {/* Alert 1: Demand forecast reorder */}
          <div className="bg-[#F7F9F4] p-4 rounded-xl border border-[#DDE5D9] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#D63A2F]"></span>
                <span className="font-bold text-sm text-[#14201B]">
                  Ponni Boiled Rice (1kg) – Reorder Recommended
                </span>
              </div>
              <p className="text-xs text-[#4E6057]">
                Only 4 bags remaining. Local demand forecast predicts 12 bags will sell before Sunday night.
              </p>
            </div>
            <Button
              variant="marigold"
              size="sm"
              onClick={() => onNavigateTab('stock')}
              className="shrink-0"
            >
              One-Tap Reorder
            </Button>
          </div>

          {/* Alert 2: Smart shelf gap */}
          <div className="bg-[#F7F9F4] p-4 rounded-xl border border-[#DDE5D9] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#FFB400]"></span>
                <span className="font-bold text-sm text-[#14201B]">
                  Smart Shelf: Gap detected in Aisle 1 (Oils & Ghee)
                </span>
              </div>
              <p className="text-xs text-[#4E6057]">
                CCTV Camera 2 detected 2 missing slots on shelf rack A2. Check stockroom to restock.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigateTab('smart-shelf')}
              className="shrink-0 text-[#0E3B2C] border-[#1F6B4A]"
            >
              View Shelf Camera
            </Button>
          </div>

          {/* Alert 3: Lost demand */}
          <div className="bg-[#F7F9F4] p-4 rounded-xl border border-[#DDE5D9] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#1F6B4A]"></span>
                <span className="font-bold text-sm text-[#14201B]">
                  High Lost Demand: "40W LED Batten Light"
                </span>
              </div>
              <p className="text-xs text-[#4E6057]">
                Searched by 9 nearby customers in Pollachi this week with zero local stock.
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigateTab('insights')}
              className="shrink-0 text-[#0E3B2C] font-bold"
            >
              Inspect Lost Demand
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Merchant Operations Shortcuts */}
      <div className="bg-[#0E3B2C] text-white rounded-2xl p-6 shadow-md border border-[#1F6B4A] space-y-4">
        <h3 className="font-display font-bold text-lg text-white">
          Quick Merchant Shortcuts
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Button
            variant="marigold"
            size="md"
            onClick={onOpenAddExpense}
            className="flex items-center justify-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Expense (10s)</span>
          </Button>

          <Button
            variant="grove"
            size="md"
            onClick={() => onNavigateTab('orders')}
            className="flex items-center justify-center gap-2 bg-[#1F6B4A] text-white border border-white/20 hover:bg-[#28845c]"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Pack Pending Order</span>
          </Button>

          <Button
            variant="outline"
            size="md"
            onClick={() => onNavigateTab('khata')}
            className="flex items-center justify-center gap-2 bg-white/10 text-white border-white/20 hover:bg-white/20"
          >
            <Wallet className="w-4 h-4 text-[#FFB400]" />
            <span>Record Khata Credit</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
