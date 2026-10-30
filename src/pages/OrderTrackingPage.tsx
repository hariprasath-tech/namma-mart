import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';
import { Order, OrderStatus } from '../types';
import { formatCurrency, formatDate } from '../lib/format';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import {
  Package,
  Truck,
  CheckCircle2,
  Store,
  Clock,
  MapPin,
  Star,
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  Send,
} from 'lucide-react';
import { useLangStore } from '../store/lang';
import { useTranslation } from 'react-i18next';

export const OrderTrackingPage: React.FC = () => {
  const { t } = useTranslation();
  const { orderId } = useParams<{ orderId: string }>();
  const { language } = useLangStore();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  // Review state
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        if (!orderId) return;
        const data = await api.getOrderById(orderId);
        if (data) {
          setOrder(data);
        } else {
          // If not found, check all orders
          const all = await api.getOrders();
          setOrder(all[0] || null);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId]);

  // Demo simulator to advance status
  const handleAdvanceStatus = async () => {
    if (!order) return;
    let nextStatus: OrderStatus = order.status;

    if (order.mode === 'delivery') {
      if (order.status === 'packed') nextStatus = 'out_for_delivery';
      else if (order.status === 'out_for_delivery') nextStatus = 'delivered';
    } else {
      if (order.status === 'packed') nextStatus = 'ready_for_pickup';
      else if (order.status === 'ready_for_pickup') nextStatus = 'picked_up';
    }

    if (nextStatus !== order.status) {
      const updated = await api.updateOrderStatus(order.id, nextStatus);
      setOrder(updated);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    await api.addReview({
      shopId: order.shopId,
      rating,
      text: reviewText.trim() || 'Prompt service and fresh items received as ordered.',
      author: order.customerName,
    });
    setReviewSubmitted(true);
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center text-[#4E6057]">
        <p>Loading order details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="font-display font-bold text-2xl text-[#14201B]">
          Order Not Found
        </h1>
        <Link to="/">
          <Button variant="palm">Return to Home</Button>
        </Link>
      </div>
    );
  }

  const isCompleted = order.status === 'delivered' || order.status === 'picked_up';

  // Stepper definition
  const steps =
    order.mode === 'delivery'
      ? [
          { key: 'packed', label: t('orders.statusPacked'), icon: Package },
          { key: 'out_for_delivery', label: t('orders.statusOutForDelivery'), icon: Truck },
          { key: 'delivered', label: t('orders.statusDelivered'), icon: CheckCircle2 },
        ]
      : [
          { key: 'packed', label: t('orders.statusPacked'), icon: Package },
          { key: 'ready_for_pickup', label: t('orders.statusReadyPickup'), icon: Store },
          { key: 'picked_up', label: t('orders.statusPickedUp'), icon: CheckCircle2 },
        ];

  const currentStepIdx = steps.findIndex((s) => s.key === order.status);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <Link
        to="/orders"
        className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#0E3B2C] hover:underline"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>{language === 'ta' ? 'அனைத்து ஆர்டர்களும்' : 'All My Orders'}</span>
      </Link>

      {/* Header Banner */}
      <div className="bg-[#0E3B2C] text-white rounded-2xl p-6 shadow-md border border-[#1F6B4A]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-2xl sm:text-3xl tracking-tight text-[#FFB400]">
                Order #{order.id}
              </span>
              <Badge variant="grove" size="sm" className="bg-[#1F6B4A] text-white border border-white/20">
                {order.mode === 'delivery' ? 'Home Delivery' : 'Store Pickup'}
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-white/80 mt-1">
              Placed on {formatDate(order.createdAt)} · {order.shopName}
            </p>
          </div>

          <div className="text-right">
            <span className="font-display font-extrabold text-2xl text-white block">
              {formatCurrency(order.totalAmount)}
            </span>
            <span className="text-xs text-[#FFB400] font-medium">
              {order.paymentStatus === 'paid' ? 'Paid via ' + order.payment.toUpperCase() : 'Pay on Delivery'}
            </span>
          </div>
        </div>
      </div>

      {/* 3-Step Visual Order Stepper */}
      <div className="bg-white rounded-2xl p-6 border border-[#DDE5D9] shadow-xs space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-lg text-[#14201B]">
            {t('orders.tracking')}
          </h2>
          {!isCompleted && (
            <button
              onClick={handleAdvanceStatus}
              className="text-xs font-semibold px-3 py-1 rounded-full bg-[#EEF3EA] text-[#0E3B2C] hover:bg-[#DDE5D9] transition-colors"
            >
              ⚡ Advance Status (Demo)
            </button>
          )}
        </div>

        <div className="relative flex items-center justify-between">
          {/* Connector bar */}
          <div className="absolute top-1/2 -translate-y-1/2 left-6 right-6 h-1 bg-[#DDE5D9] -z-0">
            <div
              className="h-full bg-[#0E3B2C] transition-all duration-300"
              style={{
                width: `${(Math.max(0, currentStepIdx) / (steps.length - 1)) * 100}%`,
              }}
            ></div>
          </div>

          {steps.map((st, idx) => {
            const Icon = st.icon;
            const isDone = idx <= currentStepIdx;
            const isCurrent = idx === currentStepIdx;

            return (
              <div key={st.key} className="flex flex-col items-center text-center z-10 w-24">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                    isDone
                      ? 'bg-[#0E3B2C] text-[#FFB400] shadow-md ring-4 ring-[#EEF3EA]'
                      : 'bg-[#F7F9F4] text-[#4E6057] border-2 border-[#DDE5D9]'
                  } ${isCurrent ? 'scale-110' : ''}`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span
                  className={`text-xs font-bold mt-2 ${
                    isDone ? 'text-[#0E3B2C]' : 'text-[#4E6057]'
                  }`}
                >
                  {st.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Receipt Ticket */}
      <div className="bg-white rounded-2xl p-6 border border-[#DDE5D9] shadow-xs space-y-4">
        <h3 className="font-display font-bold text-base text-[#14201B] border-b border-[#DDE5D9] pb-3">
          Order Items & Receipt
        </h3>

        <div className="divide-y divide-[#DDE5D9] text-sm">
          {order.items.map((it: any, idx: number) => (
            <div key={idx} className="py-2.5 flex items-center justify-between">
              <div>
                <span className="font-bold text-[#14201B]">
                  {it.qty}x {it.name}
                </span>
                <span className="text-xs text-[#4E6057] block">
                  {formatCurrency(it.price)} per {it.unit}
                </span>
              </div>
              <span className="font-display font-bold text-base text-[#0E3B2C]">
                {formatCurrency(it.price * it.qty)}
              </span>
            </div>
          ))}
        </div>

        <div className="border-t border-[#DDE5D9] pt-4 space-y-2 text-xs">
          <div className="flex justify-between text-[#4E6057]">
            <span>Subtotal</span>
            <span className="font-semibold text-[#14201B]">{formatCurrency(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-[#4E6057]">
            <span>Delivery Fee</span>
            <span className="font-semibold text-[#14201B]">
              {order.deliveryFee === 0 ? 'FREE' : formatCurrency(order.deliveryFee)}
            </span>
          </div>
          <div className="border-t border-[#DDE5D9] pt-2 flex justify-between items-baseline font-bold text-base text-[#14201B]">
            <span>Total Paid</span>
            <span className="font-display font-extrabold text-2xl text-[#0E3B2C]">
              {formatCurrency(order.totalAmount)}
            </span>
          </div>
        </div>

        {order.deliveryAddress && (
          <div className="bg-[#F7F9F4] p-3.5 rounded-xl border border-[#DDE5D9] text-xs text-[#4E6057] flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#1F6B4A] shrink-0" />
            <span>Delivering to: <strong className="text-[#14201B]">{order.deliveryAddress}</strong></span>
          </div>
        )}
      </div>

      {/* Review Box (Prompt after completion) */}
      {isCompleted && (
        <div className="bg-white rounded-2xl p-6 border-2 border-[#1F6B4A] shadow-md space-y-4">
          <h3 className="font-display font-bold text-lg text-[#0E3B2C]">
            {t('orders.rateShop')}
          </h3>

          {reviewSubmitted ? (
            <div className="bg-[#EEF3EA] rounded-xl p-4 text-center text-sm font-semibold text-[#0E3B2C] flex items-center justify-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              <span>Thank you! Your review for {order.shopName} has been recorded.</span>
            </div>
          ) : (
            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[#4E6057]">Your rating:</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 focus:outline-hidden"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= rating
                            ? 'fill-[#FFB400] text-[#FFB400]'
                            : 'text-[#BDCBB8]'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                rows={3}
                required
                placeholder="Share your experience (e.g. fresh coconut oil, accurate pricing, friendly shopkeeper)..."
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F7F9F4] border border-[#BDCBB8] rounded-xl text-sm focus:outline-[#0E3B2C]"
              />

              <Button type="submit" variant="palm" size="md">
                <Send className="w-4 h-4 mr-1.5" />
                <span>{t('orders.submitReview')}</span>
              </Button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
