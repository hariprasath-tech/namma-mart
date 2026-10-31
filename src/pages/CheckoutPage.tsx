import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/cart';
import { useAuthStore } from '../store/auth';
import { useLangStore } from '../store/lang';
import { useLocationStore } from '../store/location';
import { api } from '../api';
import { Shop, Product, Offer, PaymentMethod, OrderMode, CartItem } from '../types';
import { formatCurrency } from '../lib/format';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import {
  Truck,
  Store,
  CreditCard,
  QrCode,
  Banknote,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  ShieldCheck,
  MapPin,
  Phone,
  User,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const CheckoutPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { items, clearCart, getDistinctShopsCount } = useCartStore();
  const { user, savedAddress, setSavedAddress } = useAuthStore();
  const { selectedTown } = useLocationStore();
  const { language } = useLangStore();

  const [shops, setShops] = useState<Shop[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [mode, setMode] = useState<OrderMode>('delivery');
  const [name, setName] = useState(user?.name || 'Murugan K.');
  const [phone, setPhone] = useState(user?.phone || '+91 98421 90112');
  const [address, setAddress] = useState(savedAddress || '14, Kumaran Nagar, Palakkad Road, Pollachi');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');
  const [upiId, setUpiId] = useState('murugan@okaxis');

  // Simulation controls
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [allShops, allProds, allOffers] = await Promise.all([
          api.getShops(),
          api.getProducts(),
          api.getOffers(),
        ]);
        setShops(allShops);
        setProducts(allProds);
        setOffers(allOffers);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  const distinctShopsCount = getDistinctShopsCount();

  // Calculations
  let subtotal = 0;
  const orderItemsData: any[] = [];

  items.forEach((item: CartItem) => {
    const offer = offers.find((o) => o.id === item.offerId);
    const prod = products.find((p) => p.id === item.productId);
    if (offer && prod) {
      subtotal += offer.price * item.qty;
      orderItemsData.push({
        productId: prod.id,
        offerId: offer.id,
        name: prod.name,
        price: offer.price,
        qty: item.qty,
        unit: prod.unit,
      });
    }
  });

  const deliveryFee = mode === 'delivery' ? distinctShopsCount * 20 : 0;
  const totalAmount = subtotal + deliveryFee;

  const firstShopId = items[0]?.shopId || 'shop-1';
  const firstShop = shops.find((s) => s.id === firstShopId);

  const handlePlaceOrder = async (simulateFailure = false) => {
    setIsProcessing(true);
    setErrorMessage(null);

    // Realistic mock network processing delay
    await new Promise((r) => setTimeout(r, 900));

    if (simulateFailure) {
      setIsProcessing(false);
      setErrorMessage(t('checkout.paymentFailedMsg'));
      return;
    }

    try {
      if (distinctShopsCount > 1) {
        const mvRes = await api.createMultiVendorOrder({
          customerName: name,
          customerPhone: phone,
          deliveryAddress: mode === 'delivery' ? address : undefined,
          mode,
          payment: paymentMethod,
          items: orderItemsData.map((it) => ({
            offerId: it.offerId,
            qty: it.qty,
          })),
        });

        if (mvRes && mvRes.orders && mvRes.orders.length > 0) {
          if (mode === 'delivery') {
            setSavedAddress(address);
          }
          clearCart();
          navigate(`/orders/${mvRes.orders[0].id}`);
          return;
        }
      }

      const createdOrder = await api.createOrder({
        shopId: firstShopId,
        shopName: firstShop?.name || 'Pollachi Local Store',
        items: orderItemsData,
        mode,
        payment: paymentMethod,
        paymentStatus: paymentMethod === 'cod' ? 'pending' : 'paid',
        status: mode === 'delivery' ? 'packed' : 'ready_for_pickup',
        subtotal,
        deliveryFee,
        totalAmount,
        customerName: name,
        customerPhone: phone,
        deliveryAddress: mode === 'delivery' ? address : undefined,
      });

      if (mode === 'delivery') {
        setSavedAddress(address);
      }

      clearCart();
      navigate(`/orders/${createdOrder.id}`);
    } catch (e) {
      setErrorMessage('Failed to place order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Back button */}
      <button
        onClick={() => navigate('/cart')}
        className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#0E3B2C] hover:underline"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>{language === 'ta' ? 'கார்ட்டிற்கு திரும்புக' : 'Back to Cart'}</span>
      </button>

      <h1 className="font-display font-bold text-2xl sm:text-3xl text-[#14201B]">
        {t('checkout.title')}
      </h1>

      {/* Error alert if payment failed */}
      {errorMessage && (
        <div className="bg-[#FFF3F2] border-2 border-[#D63A2F] rounded-2xl p-4 flex items-start gap-3 animate-shake">
          <AlertTriangle className="w-5 h-5 text-[#D63A2F] shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-bold text-[#D63A2F]">Payment Incomplete</p>
            <p className="text-[#14201B] mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Form Details */}
        <div className="md:col-span-2 space-y-6">
          {/* 1. Fulfilment Method Choice */}
          <div className="bg-white rounded-2xl p-5 border border-[#DDE5D9] shadow-xs space-y-4">
            <h2 className="font-display font-bold text-lg text-[#14201B]">
              1. {t('checkout.fulfilmentMode')}
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMode('delivery')}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  mode === 'delivery'
                    ? 'border-[#0E3B2C] bg-[#EEF3EA] text-[#0E3B2C]'
                    : 'border-[#DDE5D9] text-[#14201B] hover:border-[#BDCBB8]'
                }`}
              >
                <Truck className="w-5 h-5 mb-1 text-[#0E3B2C]" />
                <span className="font-bold text-sm block">
                  {t('checkout.homeDelivery')}
                </span>
                <span className="text-xs text-[#4E6057]">
                  {formatCurrency(deliveryFee)} · Direct to doorstep
                </span>
              </button>

              <button
                type="button"
                onClick={() => setMode('pickup')}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  mode === 'pickup'
                    ? 'border-[#0E3B2C] bg-[#EEF3EA] text-[#0E3B2C]'
                    : 'border-[#DDE5D9] text-[#14201B] hover:border-[#BDCBB8]'
                }`}
              >
                <Store className="w-5 h-5 mb-1 text-[#0E3B2C]" />
                <span className="font-bold text-sm block">
                  {t('checkout.storePickup')}
                </span>
                <span className="text-xs text-[#1F6B4A] font-semibold">
                  Free · Collect directly
                </span>
              </button>
            </div>
          </div>

          {/* 2. Contact & Delivery Address */}
          <div className="bg-white rounded-2xl p-5 border border-[#DDE5D9] shadow-xs space-y-4">
            <h2 className="font-display font-bold text-lg text-[#14201B]">
              2. {mode === 'delivery' ? t('checkout.addressTitle') : 'Contact Information'}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-[#14201B] uppercase tracking-wider block mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#4E6057] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-[#F7F9F4] border border-[#BDCBB8] rounded-xl text-sm focus:outline-[#0E3B2C]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#14201B] uppercase tracking-wider block mb-1">
                  Mobile Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-[#4E6057] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-[#F7F9F4] border border-[#BDCBB8] rounded-xl text-sm focus:outline-[#0E3B2C]"
                  />
                </div>
              </div>
            </div>

            {mode === 'delivery' && (
              <div>
                <label className="text-xs font-bold text-[#14201B] uppercase tracking-wider block mb-1">
                  Street Address & Landmark in {selectedTown.name}
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-[#4E6057] absolute left-3 top-3" />
                  <textarea
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-[#F7F9F4] border border-[#BDCBB8] rounded-xl text-sm focus:outline-[#0E3B2C]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 3. Payment Method */}
          <div className="bg-white rounded-2xl p-5 border border-[#DDE5D9] shadow-xs space-y-4">
            <h2 className="font-display font-bold text-lg text-[#14201B]">
              3. {t('checkout.paymentTitle')}
            </h2>

            <div className="space-y-3">
              {/* UPI Option */}
              <label
                className={`flex items-start gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                  paymentMethod === 'upi'
                    ? 'border-[#0E3B2C] bg-[#EEF3EA]'
                    : 'border-[#DDE5D9] hover:bg-[#F7F9F4]'
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'upi'}
                  onChange={() => setPaymentMethod('upi')}
                  className="mt-1 text-[#0E3B2C] focus:ring-[#0E3B2C]"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-[#0E3B2C]" />
                    <span className="font-bold text-sm text-[#14201B]">
                      {t('checkout.upi')}
                    </span>
                    <Badge variant="grove" size="sm">
                      Recommended
                    </Badge>
                  </div>

                  {paymentMethod === 'upi' && (
                    <div className="mt-3 p-3 bg-white rounded-xl border border-[#DDE5D9] space-y-2">
                      <p className="text-xs text-[#4E6057]">
                        Scan with Google Pay, PhonePe, Paytm, or enter your UPI ID:
                      </p>
                      <input
                        type="text"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="yourname@okhdfcbank"
                        className="w-full px-3 py-2 text-xs bg-[#F7F9F4] border border-[#BDCBB8] rounded-lg focus:outline-[#0E3B2C]"
                      />
                    </div>
                  )}
                </div>
              </label>

              {/* Card Option */}
              <label
                className={`flex items-start gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                  paymentMethod === 'card'
                    ? 'border-[#0E3B2C] bg-[#EEF3EA]'
                    : 'border-[#DDE5D9] hover:bg-[#F7F9F4]'
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'card'}
                  onChange={() => setPaymentMethod('card')}
                  className="mt-1 text-[#0E3B2C] focus:ring-[#0E3B2C]"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-[#0E3B2C]" />
                    <span className="font-bold text-sm text-[#14201B]">
                      {t('checkout.card')}
                    </span>
                  </div>

                  {paymentMethod === 'card' && (
                    <div className="mt-3 p-3 bg-white rounded-xl border border-[#DDE5D9] space-y-2">
                      <input
                        type="text"
                        defaultValue="4111 •••• •••• 8912"
                        className="w-full px-3 py-2 text-xs bg-[#F7F9F4] border border-[#BDCBB8] rounded-lg"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          defaultValue="12/28"
                          className="w-full px-3 py-2 text-xs bg-[#F7F9F4] border border-[#BDCBB8] rounded-lg text-center"
                        />
                        <input
                          type="password"
                          defaultValue="•••"
                          className="w-full px-3 py-2 text-xs bg-[#F7F9F4] border border-[#BDCBB8] rounded-lg text-center"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </label>

              {/* COD Option */}
              <label
                className={`flex items-start gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                  paymentMethod === 'cod'
                    ? 'border-[#0E3B2C] bg-[#EEF3EA]'
                    : 'border-[#DDE5D9] hover:bg-[#F7F9F4]'
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'cod'}
                  onChange={() => setPaymentMethod('cod')}
                  className="mt-1 text-[#0E3B2C] focus:ring-[#0E3B2C]"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <Banknote className="w-4 h-4 text-[#0E3B2C]" />
                    <span className="font-bold text-sm text-[#14201B]">
                      {t('checkout.cod')}
                    </span>
                  </div>
                  <p className="text-xs text-[#4E6057] mt-0.5">
                    Pay with cash or UPI directly when parcel is received.
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Order Review & CTA */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-[#DDE5D9] shadow-sm space-y-4">
            <h2 className="font-display font-bold text-base text-[#14201B]">
              Order Summary
            </h2>

            <div className="space-y-2 text-xs divide-y divide-[#DDE5D9]">
              {orderItemsData.map((it, idx) => (
                <div key={idx} className="pt-2 first:pt-0 flex justify-between">
                  <span className="text-[#4E6057]">
                    {it.qty}x {it.name}
                  </span>
                  <span className="font-semibold text-[#14201B]">
                    {formatCurrency(it.price * it.qty)}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-[#DDE5D9] pt-3 space-y-1.5 text-xs">
              <div className="flex justify-between text-[#4E6057]">
                <span>{t('cart.subtotal')}</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-[#4E6057]">
                <span>{t('cart.deliveryFee')}</span>
                <span>{deliveryFee === 0 ? 'FREE' : formatCurrency(deliveryFee)}</span>
              </div>
              <div className="border-t border-[#DDE5D9] pt-2 flex justify-between items-baseline font-bold text-sm text-[#14201B]">
                <span>{t('cart.total')}</span>
                <span className="font-display font-extrabold text-xl text-[#0E3B2C]">
                  {formatCurrency(totalAmount)}
                </span>
              </div>
            </div>

            {/* Primary Action Button */}
            <Button
              variant="marigold"
              size="lg"
              fullWidth
              disabled={isProcessing}
              onClick={() => handlePlaceOrder(false)}
            >
              <ShieldCheck className="w-5 h-5 mr-2" />
              <span>{isProcessing ? 'Processing...' : t('checkout.placeOrderBtn')}</span>
            </Button>

            {/* Mock Test Simulation Helpers */}
            <div className="pt-2 border-t border-[#DDE5D9] space-y-2">
              <span className="text-[11px] text-[#4E6057] block font-semibold uppercase tracking-wider text-center">
                Review & Testing Simulation Helpers
              </span>
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => handlePlaceOrder(false)}
                className="w-full py-1.5 rounded-lg border border-[#1F6B4A] bg-[#EEF3EA] text-[#0E3B2C] text-xs font-semibold hover:bg-[#DDE5D9] transition-colors"
              >
                ✓ {t('checkout.simulatedSuccess')}
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => handlePlaceOrder(true)}
                className="w-full py-1.5 rounded-lg border border-[#D63A2F]/40 bg-[#FFF3F2] text-[#D63A2F] text-xs font-semibold hover:bg-[#FFE8E6] transition-colors"
              >
                ✗ {t('checkout.simulatedFailure')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
