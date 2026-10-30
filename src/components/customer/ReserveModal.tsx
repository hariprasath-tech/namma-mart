import React, { useState, useEffect } from 'react';
import { Offer, Product, Shop, Hold } from '../../types';
import { api } from '../../api';
import { formatCurrency } from '../../lib/format';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  Clock,
  Navigation,
  CheckCircle2,
  X,
  AlertTriangle,
  Store,
  ShieldCheck,
} from 'lucide-react';

interface ReserveModalProps {
  offer: Offer;
  product: Product;
  shop: Shop;
  isOpen: boolean;
  onClose: () => void;
  onHoldCreated?: (hold: Hold) => void;
}

export const ReserveModal: React.FC<ReserveModalProps> = ({
  offer,
  product,
  shop,
  isOpen,
  onClose,
  onHoldCreated,
}) => {
  const [activeHold, setActiveHold] = useState<Hold | null>(null);
  const [timeLeftSecs, setTimeLeftSecs] = useState<number>(30 * 60); // 30 minutes
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    // Check if there's already an active hold for this offer
    api.getHolds().then((holds) => {
      const match = holds.find((h) => h.offerId === offer.id && !h.claimed);
      if (match) {
        setActiveHold(match);
        const remaining = Math.max(
          0,
          Math.floor((new Date(match.expiresAt).getTime() - Date.now()) / 1000)
        );
        setTimeLeftSecs(remaining);
      } else {
        setActiveHold(null);
        setTimeLeftSecs(30 * 60);
      }
    });
  }, [isOpen, offer.id]);

  // Countdown timer
  useEffect(() => {
    if (!activeHold || timeLeftSecs <= 0) return;
    const timer = setInterval(() => {
      setTimeLeftSecs((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [activeHold, timeLeftSecs]);

  if (!isOpen) return null;

  const handleConfirmHold = async () => {
    setIsSubmitting(true);
    try {
      const created = await api.createHold({
        offerId: offer.id,
        productId: product.id,
        shopId: shop.id,
        shopName: shop.shortName || shop.name,
        qty: 1,
      });
      setActiveHold(created);
      setTimeLeftSecs(30 * 60);
      if (onHoldCreated) onHoldCreated(created);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelHold = async () => {
    if (!activeHold) return;
    try {
      await api.cancelHold(activeHold.id);
      setActiveHold(null);
      setTimeLeftSecs(30 * 60);
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenDirections = () => {
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${shop.lat},${shop.lng}`,
      '_blank'
    );
  };

  const mins = Math.floor(timeLeftSecs / 60);
  const secs = timeLeftSecs % 60;
  const progressPercent = (timeLeftSecs / (30 * 60)) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[#DDE5D9] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#0E3B2C] text-white">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#FFB400]" />
            <h2 className="font-display font-bold text-lg">Reserve & Pick Up (Zero Payment)</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-white/80 hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Product & Store Snapshot */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-[#F7F9F4] border border-[#DDE5D9]">
            <img
              src={product.image}
              alt={product.name}
              className="w-14 h-14 rounded-lg object-cover bg-white border border-[#DDE5D9]"
            />
            <div className="min-w-0 flex-1">
              <h3 className="font-display font-bold text-sm text-[#14201B] truncate">
                {product.name}
              </h3>
              <p className="text-xs text-[#4E6057]">
                {shop.name} ({shop.area})
              </p>
              <span className="font-display font-extrabold text-base text-[#0E3B2C] block mt-0.5">
                {formatCurrency(offer.price)}
              </span>
            </div>
          </div>

          {!activeHold ? (
            /* Pre-Hold Explanation & Commitment */
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#EEF3EA] border border-[#BDCBB8] space-y-2 text-xs text-[#0E3B2C]">
                <p className="font-bold flex items-center gap-1.5 text-sm">
                  <ShieldCheck className="w-4 h-4 text-[#1F6B4A]" />
                  No Payment Required Now
                </p>
                <p className="text-[#4E6057] leading-relaxed">
                  We'll lock this item for <strong>30 minutes</strong> at {shop.name}. If you don't pick it up, the reservation quietly expires without any penalty. Eliminates wasted trips to Pollachi market!
                </p>
              </div>

              <div className="space-y-2 pt-1">
                <Button
                  variant="marigold"
                  size="md"
                  fullWidth
                  onClick={handleConfirmHold}
                  disabled={isSubmitting}
                  className="font-bold text-sm"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  <span>{isSubmitting ? 'Holding Item...' : 'Hold for 30 Minutes'}</span>
                </Button>
                <button
                  onClick={onClose}
                  className="w-full text-center text-xs text-[#4E6057] hover:underline py-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            /* Active Hold Countdown State */
            <div className="text-center space-y-5">
              {/* Animated Countdown Ring */}
              <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="44"
                    fill="none"
                    stroke="#EEF3EA"
                    strokeWidth="8"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="44"
                    fill="none"
                    stroke="#FFB400"
                    strokeWidth="8"
                    strokeDasharray="276"
                    strokeDashoffset={276 - (276 * progressPercent) / 100}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-linear"
                  />
                </svg>

                <div className="absolute flex flex-col items-center">
                  <span className="font-display font-extrabold text-2xl text-[#0E3B2C]">
                    {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-[#4E6057]">
                    Time Remaining
                  </span>
                </div>
              </div>

              <div className="bg-[#FFFBEB] p-3 rounded-xl border border-[#FFB400]/40 text-xs text-[#854D0E]">
                <p className="font-bold">Item is reserved at the counter!</p>
                <p className="text-[11px] mt-0.5">Show this screen or quote Hold #{activeHold.id.slice(-4)} to the shopkeeper.</p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 pt-1">
                <Button
                  variant="palm"
                  size="md"
                  fullWidth
                  onClick={handleOpenDirections}
                  className="font-bold text-xs"
                >
                  <Navigation className="w-4 h-4 mr-2" />
                  <span>Get Directions to {shop.shortName || shop.name}</span>
                </Button>

                <button
                  onClick={handleCancelHold}
                  className="w-full text-center text-xs font-semibold text-[#D63A2F] hover:underline py-1.5"
                >
                  Cancel Hold & Free Stock
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
