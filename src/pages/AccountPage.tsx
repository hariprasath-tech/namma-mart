import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { useLangStore } from '../store/lang';
import { api } from '../api';
import { Order } from '../types';
import { formatCurrency, formatDate } from '../lib/format';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import {
  User,
  Package,
  MapPin,
  Globe,
  Store,
  Info,
  ChevronRight,
  LogOut,
  Edit2,
  Check,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Cpu,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const AccountPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, savedAddress, setSavedAddress, logout } = useAuthStore();
  const { language, setLanguage } = useLangStore();

  const [orders, setOrders] = useState<Order[]>([]);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [tempAddress, setTempAddress] = useState(savedAddress);

  useEffect(() => {
    const fetchOrders = async () => {
      const all = await api.getOrders();
      setOrders(all);
    };
    fetchOrders();
  }, []);

  const handleSaveAddress = () => {
    setSavedAddress(tempAddress);
    setIsEditingAddress(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <h1 className="font-display font-bold text-2xl sm:text-3xl text-[#14201B]">
        {t('nav.account')}
      </h1>

      {/* User Profile Card */}
      <div className="bg-[#0E3B2C] text-white rounded-2xl p-6 shadow-md border border-[#1F6B4A] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center text-[#FFB400] font-display font-extrabold text-2xl">
            {user?.name?.[0] || 'M'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display font-bold text-xl sm:text-2xl">
                {user?.name || 'Murugan K.'}
              </h2>
              <Badge variant="grove" size="sm" className="bg-[#1F6B4A] text-white border border-white/20">
                Pollachi Resident
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-white/80">
              {user?.phone || '+91 98421 90112'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link to="/login">
            <Button variant="outline" size="sm" className="inline-flex items-center gap-1.5 text-white border-white/30 hover:bg-white/10">
              <User className="w-4 h-4 text-[#FFB400]" />
              <span>Switch User / Sign In</span>
            </Button>
          </Link>
          <Link to="/shop">
            <Button variant="marigold" size="sm" className="inline-flex items-center gap-1.5 font-bold">
              <Store className="w-4 h-4" />
              <span>Shop Owner Portal</span>
            </Button>
          </Link>
          <Link to="/admin">
            <Button variant="outline" size="sm" className="inline-flex items-center gap-1.5 text-white border-white/30 hover:bg-white/10">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Admin Center</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Saved Delivery Address */}
        <div className="bg-white rounded-2xl p-5 border border-[#DDE5D9] shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#0E3B2C] font-bold text-base">
              <MapPin className="w-4 h-4 text-[#1F6B4A]" />
              <span>Saved Delivery Address</span>
            </div>
            {!isEditingAddress ? (
              <button
                onClick={() => setIsEditingAddress(true)}
                className="text-xs text-[#0E3B2C] hover:underline font-semibold flex items-center gap-1"
              >
                <Edit2 className="w-3 h-3" /> Edit
              </button>
            ) : (
              <button
                onClick={handleSaveAddress}
                className="text-xs text-[#1F6B4A] font-bold flex items-center gap-1"
              >
                <Check className="w-3 h-3" /> Save
              </button>
            )}
          </div>

          {!isEditingAddress ? (
            <p className="text-xs sm:text-sm text-[#4E6057] bg-[#F7F9F4] p-3 rounded-xl border border-[#DDE5D9]">
              {savedAddress}
            </p>
          ) : (
            <textarea
              rows={2}
              value={tempAddress}
              onChange={(e) => setTempAddress(e.target.value)}
              className="w-full text-xs sm:text-sm text-[#14201B] bg-[#F7F9F4] p-3 rounded-xl border border-[#0E3B2C] focus:outline-hidden"
            />
          )}
        </div>

        {/* Language Selection */}
        <div className="bg-white rounded-2xl p-5 border border-[#DDE5D9] shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-[#0E3B2C] font-bold text-base">
            <Globe className="w-4 h-4 text-[#1F6B4A]" />
            <span>App Language / பயன்பாட்டு மொழி</span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              onClick={() => setLanguage('en')}
              className={`p-3 rounded-xl border-2 font-bold text-sm transition-all ${
                language === 'en'
                  ? 'border-[#0E3B2C] bg-[#EEF3EA] text-[#0E3B2C]'
                  : 'border-[#DDE5D9] text-[#14201B] hover:bg-[#F7F9F4]'
              }`}
            >
              English
            </button>
            <button
              onClick={() => setLanguage('ta')}
              className={`p-3 rounded-xl border-2 font-bold text-sm transition-all ${
                language === 'ta'
                  ? 'border-[#0E3B2C] bg-[#EEF3EA] text-[#0E3B2C]'
                  : 'border-[#DDE5D9] text-[#14201B] hover:bg-[#F7F9F4]'
              }`}
            >
              தமிழ் (Tamil)
            </button>
          </div>
        </div>
      </div>

      {/* Recent Orders List */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#DDE5D9] shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-lg text-[#14201B] flex items-center gap-2">
            <Package className="w-5 h-5 text-[#0E3B2C]" />
            <span>My Orders ({orders.length})</span>
          </h2>
        </div>

        {orders.length === 0 ? (
          <p className="text-xs text-[#4E6057]">No orders placed yet.</p>
        ) : (
          <div className="divide-y divide-[#DDE5D9]">
            {orders.map((ord: Order) => (
              <div
                key={ord.id}
                className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base text-[#0E3B2C]">
                      Order #{ord.id}
                    </span>
                    <Badge variant={ord.status === 'delivered' || ord.status === 'picked_up' ? 'grove' : 'subtle'} size="sm">
                      {ord.status.toUpperCase()}
                    </Badge>
                  </div>
                  <span className="text-xs text-[#4E6057] block mt-0.5">
                    {formatDate(ord.createdAt)} · {ord.shopName} · {ord.items.length} items
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <span className="font-display font-bold text-base text-[#14201B]">
                    {formatCurrency(ord.totalAmount)}
                  </span>
                  <Link
                    to={`/orders/${ord.id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#EEF3EA] hover:bg-[#DDE5D9] text-[#0E3B2C] transition-colors"
                  >
                    <span>Track</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Honest Academic Rigor & Viva Disclosure (TRL 3) */}
      <div className="bg-white rounded-2xl p-6 border border-[#DDE5D9] shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#DDE5D9] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0E3B2C] text-[#FFB400] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg text-[#14201B]">
                Academic Rigor & Honesty Disclosure (Viva Panel)
              </h2>
              <span className="text-xs text-[#4E6057]">
                Project Status: <strong>Technology Readiness Level 3 (TRL 3)</strong> — Experimental Proof of Concept
              </span>
            </div>
          </div>

          <Badge variant="subtle" size="sm" className="bg-[#EEF3EA] text-[#0E3B2C] font-bold">
            TRL 3 Certified
          </Badge>
        </div>

        <p className="text-xs text-[#4E6057] leading-relaxed">
          LocalKart v2 is an experimental Design Thinking capstone prototype built for Pollachi, Tamil Nadu. To ensure absolute academic integrity and transparency during evaluation, the table below specifies exactly which aspects of this prototype are real and which components operate under a deterministic simulation engine.
        </p>

        {/* Real vs Simulated Specification Table */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Column 1: What is Real */}
          <div className="p-4 rounded-xl bg-[#EEF3EA]/70 border border-[#BDCBB8] space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#0E3B2C] uppercase">
              <CheckCircle2 className="w-4 h-4 text-[#1F6B4A]" />
              <span>What is 100% Real</span>
            </div>
            <ul className="text-xs text-[#14201B] space-y-1.5 list-disc list-inside">
              <li><strong>UI Architecture:</strong> React 19, TypeScript, TailwindCSS v4, Leaflet map geometry.</li>
              <li><strong>Geographic Calculations:</strong> Haversine mathematical spherical distance formula using actual GPS coordinates for Pollachi, Kinathukadavu, Anamalai, and Udumalpet.</li>
              <li><strong>Smart Basket Optimizer:</strong> Pure function computing single vs split store costs with delivery fee comparisons.</li>
              <li><strong>State & Mutations:</strong> Reactive Zustand stores with full LocalStorage mutation persistence.</li>
              <li><strong>Speech Recognition:</strong> Native browser Web Speech API for Tamil (<code className="bg-white px-1 py-0.5 rounded">ta-IN</code>) and English voice input.</li>
              <li><strong>Unit Test Suite:</strong> Vitest covering math, pricing, P&L, day closing cash diff, and classifier determinism.</li>
            </ul>
          </div>

          {/* Column 2: What is Simulated */}
          <div className="p-4 rounded-xl bg-[#FFFBEB]/70 border border-[#FFB400]/50 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#854D0E] uppercase">
              <Cpu className="w-4 h-4 text-[#FFB400]" />
              <span>What is Simulated (Seed: localkart_pollachi_v2)</span>
            </div>
            <ul className="text-xs text-[#14201B] space-y-1.5 list-disc list-inside">
              <li><strong>Smart Shelf Vision:</strong> Edge CCTV gap detection and bounding boxes are generated by a deterministic Mulberry32 seed engine (carrying the <code className="bg-white px-1 py-0.5 rounded">Simulated demo</code> chip).</li>
              <li><strong>Crowd & Queues:</strong> Store footfall counts and billing line estimations follow realistic diurnal retail curves.</li>
              <li><strong>7-Day Demand Forecast:</strong> Area charts with confidence intervals simulate future machine learning inferences.</li>
              <li><strong>Financial Transactions:</strong> Mock UPI / Cash on Delivery payments without real bank settlement gateways.</li>
              <li><strong>Delivery Logistics:</strong> Simulated rider tracking without real GPS hardware units.</li>
            </ul>
          </div>
        </div>

        <div className="p-3 bg-[#F7F9F4] rounded-xl border border-[#DDE5D9] text-[11px] text-[#4E6057] flex items-center justify-between">
          <span>Department of Computer Science & Engineering · Sri Eshwar College of Engineering</span>
          <span className="font-semibold text-[#0E3B2C]">LocalKart v2 — Pollachi, TN</span>
        </div>
      </div>
    </div>
  );
};
