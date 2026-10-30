import React, { useState } from 'react';
import { api } from '../../api';
import { useCartStore } from '../../store/cart';
import { formatCurrency } from '../../lib/format';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  Calendar,
  RotateCcw,
  CheckCircle2,
  X,
  ShoppingBag,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

interface MonthlyListModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SavedList {
  id: string;
  name: string;
  description: string;
  items: { name: string; qty: number; unit: string; prodId: string }[];
  estCost: number;
}

const SAVED_LISTS: SavedList[] = [
  {
    id: 'monthly-staples',
    name: 'Monthly Family Groceries (நம்ம மாதாந்திர மளிகை)',
    description: 'Essential cooking grains, cold-pressed oil, lentils and jaggery',
    estCost: 780,
    items: [
      { name: 'Ponni Boiled Rice', qty: 5, unit: 'kg', prodId: 'prod-1' },
      { name: 'Pure Cold-Pressed Coconut Oil', qty: 2, unit: 'L', prodId: 'prod-2' },
      { name: 'Pollachi Toor Dal', qty: 2, unit: 'kg', prodId: 'prod-3' },
      { name: 'Palm Jaggery / Karupatti', qty: 1, unit: 'kg', prodId: 'prod-4' },
      { name: 'Tata Salt', qty: 1, unit: 'kg', prodId: 'prod-6' },
    ],
  },
  {
    id: 'weekly-kitchen',
    name: 'Weekly Fresh Kitchen Refill',
    description: 'Dairy, daily spices and fresh staples',
    estCost: 340,
    items: [
      { name: 'Aavin Green Milk', qty: 4, unit: 'pkt', prodId: 'prod-5' },
      { name: 'Erode Turmeric Powder', qty: 1, unit: 'pkt', prodId: 'prod-7' },
      { name: 'Cold-Pressed Coconut Oil', qty: 1, unit: 'L', prodId: 'prod-2' },
    ],
  },
];

export const MonthlyListModal: React.FC<MonthlyListModalProps> = ({ isOpen, onClose }) => {
  const { addItem, clearCart } = useCartStore();
  const [activeListId, setActiveListId] = useState<string>('monthly-staples');
  const [rebuilding, setRebuilding] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const currentList = SAVED_LISTS.find((l) => l.id === activeListId) || SAVED_LISTS[0];

  const handleOneTapReorder = async () => {
    setRebuilding(true);
    try {
      const allOffers = await api.getOffers();
      clearCart();

      // For each item in the saved list, find the cheapest in-stock offer
      for (const item of currentList.items) {
        const itemOffers = allOffers.filter(
          (o) => o.productId === item.prodId && o.stock > 0
        );
        itemOffers.sort((a, b) => a.price - b.price);
        if (itemOffers.length > 0) {
          const cheapest = itemOffers[0];
          addItem(cheapest.id, item.prodId, cheapest.shopId, item.qty);
        }
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1400);
    } catch (e) {
      console.error(e);
    } finally {
      setRebuilding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-[#DDE5D9] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#0E3B2C] text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-[#FFB400]">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg">Monthly List & 1-Tap Reorder</h2>
              <p className="text-xs text-white/80">
                Rebuilds cart instantly from the cheapest nearby offers.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-white/80 hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto">
          {/* List Selector Tabs */}
          <div className="flex items-center gap-2 border-b border-[#DDE5D9] pb-2">
            {SAVED_LISTS.map((list) => (
              <button
                key={list.id}
                onClick={() => setActiveListId(list.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeListId === list.id
                    ? 'bg-[#0E3B2C] text-[#FFB400]'
                    : 'bg-[#F7F9F4] text-[#4E6057] hover:bg-[#EEF3EA]'
                }`}
              >
                {list.name.split(' (')[0]}
              </button>
            ))}
          </div>

          <div>
            <h3 className="font-display font-bold text-base text-[#14201B]">
              {currentList.name}
            </h3>
            <p className="text-xs text-[#4E6057] mt-0.5">{currentList.description}</p>
          </div>

          {/* Items Table */}
          <div className="bg-[#F7F9F4] rounded-xl p-3 border border-[#DDE5D9] divide-y divide-[#DDE5D9] text-xs">
            {currentList.items.map((it, idx) => (
              <div key={idx} className="py-2 flex items-center justify-between">
                <span className="font-semibold text-[#14201B]">{it.name}</span>
                <span className="font-bold text-[#0E3B2C] bg-white px-2 py-0.5 rounded border border-[#DDE5D9]">
                  {it.qty} {it.unit}
                </span>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-xl bg-[#EEF3EA] border border-[#BDCBB8] text-xs text-[#0E3B2C] flex items-center justify-between">
            <span>Estimated Cart Total (Cheapest Nearby):</span>
            <span className="font-display font-extrabold text-base">
              ~{formatCurrency(currentList.estCost)}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#F7F9F4] border-t border-[#DDE5D9] flex items-center justify-between gap-3 shrink-0">
          <button onClick={onClose} className="text-xs text-[#4E6057] hover:underline">
            Cancel
          </button>

          <Button
            variant="marigold"
            size="md"
            onClick={handleOneTapReorder}
            disabled={rebuilding}
            className="font-bold text-xs"
          >
            {success ? (
              <span className="flex items-center gap-1.5 text-[#14201B]">
                <CheckCircle2 className="w-4 h-4 text-[#1F6B4A]" /> Cart Rebuilt!
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <RotateCcw className={`w-4 h-4 ${rebuilding ? 'animate-spin' : ''}`} />
                <span>1-Tap Rebuild from Cheapest Shops</span>
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
