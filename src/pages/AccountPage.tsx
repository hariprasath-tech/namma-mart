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
      <div className="bg-[#0E3B2C] text-white rounded-2xl p-6 shadow-md border border-[#1F6B4A] flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center text-[#FFB400] font-display font-extrabold text-2xl">
            {user?.name?.[0] || 'M'}
          </div>
          <div>
            <h2 className="font-display font-bold text-xl sm:text-2xl">
              {user?.name || 'Murugan K.'}
            </h2>
            <p className="text-xs sm:text-sm text-white/80">
              {user?.phone || '+91 98421 90112'}
            </p>
          </div>
        </div>

        <Link to="/shop">
          <Button variant="marigold" size="sm" className="hidden sm:inline-flex items-center gap-1.5">
            <Store className="w-4 h-4" />
            <span>Switch to Shop Owner</span>
          </Button>
        </Link>
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
              className="w-full p-2.5 bg-[#F7F9F4] border border-[#BDCBB8] rounded-xl text-xs sm:text-sm focus:outline-[#0E3B2C]"
            />
          )}
        </div>

        {/* Language Selection */}
        <div className="bg-white rounded-2xl p-5 border border-[#DDE5D9] shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-[#0E3B2C] font-bold text-base">
            <Globe className="w-4 h-4 text-[#1F6B4A]" />
            <span>Language / மொழி</span>
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

      {/* Demo Data & Academic Disclosure Badge Box */}
      <div className="bg-[#F7F9F4] rounded-2xl p-5 border border-[#DDE5D9] space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-[#0E3B2C] uppercase tracking-wider">
          <Info className="w-4 h-4 text-[#1F6B4A]" />
          <span>Academic Project & Honest Disclosure Notice</span>
        </div>
        <p className="text-xs text-[#4E6057] leading-relaxed">
          LocalKart is a Design Thinking and Innovation Project (TRL 3 Prototype) developed at Sri Eshwar College of Engineering, Computer Science and Engineering Department (Batch 2025–2029). All shop records, prices, distances, and reviews are simulated sample data for Pollachi town. No real currency is transferred.
        </p>
      </div>
    </div>
  );
};
