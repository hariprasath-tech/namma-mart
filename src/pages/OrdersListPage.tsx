import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { Order } from '../types';
import { formatCurrency, formatDate } from '../lib/format';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Package, ChevronRight, Store, Truck, Clock } from 'lucide-react';
import { useLangStore } from '../store/lang';
import { useTranslation } from 'react-i18next';

export const OrdersListPage: React.FC = () => {
  const { t } = useTranslation();
  const { language } = useLangStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.getOrders();
        setOrders(data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display font-bold text-2xl sm:text-3xl text-[#14201B]">
          {t('orders.title')} ({orders.length})
        </h1>
      </div>

      {loading ? (
        <div className="py-16 text-center text-[#4E6057]">
          <p>Loading your orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-[#DDE5D9] space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-[#EEF3EA] text-[#0E3B2C] flex items-center justify-center mx-auto">
            <Package className="w-8 h-8" />
          </div>
          <h2 className="font-display font-bold text-xl text-[#14201B]">
            No Orders Yet
          </h2>
          <p className="text-xs text-[#4E6057]">
            Place an order from any Pollachi local store and track its status live here.
          </p>
          <Link to="/">
            <Button variant="palm" size="md">
              Start Shopping
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((ord) => (
            <div
              key={ord.id}
              className="bg-white rounded-2xl p-5 border border-[#DDE5D9] shadow-xs space-y-3"
            >
              <div className="flex items-center justify-between border-b border-[#DDE5D9] pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display font-extrabold text-lg text-[#0E3B2C]">
                      Order #{ord.id}
                    </span>
                    <Badge
                      variant={
                        ord.status === 'delivered' || ord.status === 'picked_up'
                          ? 'grove'
                          : 'subtle'
                      }
                      size="sm"
                    >
                      {ord.status.toUpperCase()}
                    </Badge>
                  </div>
                  <span className="text-xs text-[#4E6057] block mt-0.5">
                    {formatDate(ord.createdAt)} · {ord.shopName}
                  </span>
                </div>

                <div className="text-right">
                  <span className="font-display font-bold text-lg text-[#14201B] block">
                    {formatCurrency(ord.totalAmount)}
                  </span>
                  <span className="text-[11px] text-[#1F6B4A] font-semibold">
                    {ord.mode === 'delivery' ? 'Home Delivery' : 'Store Pickup'}
                  </span>
                </div>
              </div>

              {/* Items summary */}
              <div className="text-xs text-[#4E6057] space-y-1">
                {ord.items.map((it: any, idx: number) => (
                  <div key={idx} className="flex justify-between">
                    <span>
                      {it.qty}x {it.name}
                    </span>
                    <span className="font-semibold text-[#14201B]">
                      {formatCurrency(it.price * it.qty)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-2 flex justify-end">
                <Link to={`/orders/${ord.id}`}>
                  <Button variant="palm" size="sm" className="flex items-center gap-1.5">
                    <span>{language === 'ta' ? 'நிலையைக் கண்காணிக்கவும்' : 'Track Order'}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
