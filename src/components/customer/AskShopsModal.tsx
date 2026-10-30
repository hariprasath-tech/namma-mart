import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import { ItemRequest } from '../../types';
import { formatDate } from '../../lib/format';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  MessageSquare,
  Send,
  CheckCircle2,
  Clock,
  MapPin,
  Store,
  X,
  Plus,
  Sparkles,
} from 'lucide-react';

interface AskShopsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AskShopsModal: React.FC<AskShopsModalProps> = ({ isOpen, onClose }) => {
  const [requests, setRequests] = useState<ItemRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [itemText, setItemText] = useState('');
  const [area, setArea] = useState('Market Road');
  const [customerName, setCustomerName] = useState('Kavitha');
  const [customerPhone, setCustomerPhone] = useState('+91 98420 12345');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const all = await api.getItemRequests();
      setRequests(all);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadRequests();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemText.trim()) return;
    setIsSubmitting(true);
    try {
      const created = await api.createItemRequest({
        text: itemText.trim(),
        area,
        customerName,
        customerPhone,
      });
      setRequests((prev) => [created, ...prev]);
      setItemText('');
      setShowNewForm(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-[#DDE5D9] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#0E3B2C] text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-[#FFB400]">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg">Can't Find It? Ask Nearby Shops</h2>
              <p className="text-xs text-white/80">
                Pollachi merchants receive your query and reply with price & availability.
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
          {/* Post New Query CTA or Form */}
          {!showNewForm ? (
            <div className="flex items-center justify-between p-4 rounded-xl bg-[#EEF3EA] border border-[#BDCBB8]">
              <div>
                <p className="font-display font-bold text-sm text-[#0E3B2C]">
                  Looking for a hard-to-find item?
                </p>
                <p className="text-xs text-[#4E6057] mt-0.5">
                  Broadcast to 14+ local Pollachi shops in one tap.
                </p>
              </div>
              <Button
                variant="palm"
                size="sm"
                onClick={() => setShowNewForm(true)}
                className="font-bold text-xs shrink-0"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                <span>Ask Shops</span>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmitRequest} className="p-4 rounded-xl bg-[#F7F9F4] border border-[#BDCBB8] space-y-3">
              <div className="flex items-center justify-between border-b border-[#DDE5D9] pb-2">
                <span className="font-bold text-xs uppercase text-[#0E3B2C]">New Item Request</span>
                <button
                  type="button"
                  onClick={() => setShowNewForm(false)}
                  className="text-xs text-[#4E6057] hover:underline"
                >
                  Cancel
                </button>
              </div>

              <div>
                <label className="text-xs font-bold text-[#14201B] block mb-1">
                  What item do you need?
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 40W Philips B22 LED Bulb, needed today"
                  value={itemText}
                  onChange={(e) => setItemText(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#BDCBB8] rounded-xl text-xs focus:outline-[#0E3B2C]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#14201B] block mb-1">
                    Your Area in Town
                  </label>
                  <select
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#BDCBB8] rounded-xl text-xs focus:outline-[#0E3B2C]"
                  >
                    <option value="Market Road">Market Road</option>
                    <option value="Bazaar Street">Bazaar Street</option>
                    <option value="Palakkad Road">Palakkad Road</option>
                    <option value="New Scheme Road">New Scheme Road</option>
                    <option value="Udumalpet Road">Udumalpet Road</option>
                    <option value="Kottur Road">Kottur Road</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#14201B] block mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#BDCBB8] rounded-xl text-xs focus:outline-[#0E3B2C]"
                  />
                </div>
              </div>

              <div className="pt-1">
                <Button
                  type="submit"
                  variant="palm"
                  size="sm"
                  fullWidth
                  disabled={isSubmitting}
                  className="font-bold text-xs"
                >
                  <Send className="w-3.5 h-3.5 mr-1.5" />
                  <span>{isSubmitting ? 'Broadcasting...' : 'Broadcast to Local Shops'}</span>
                </Button>
              </div>
            </form>
          )}

          {/* Active Live Requests & Merchant Responses */}
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase text-[#4E6057] block">
              Recent Inquiries & Live Merchant Quotes
            </span>

            {loading ? (
              <p className="text-xs text-[#4E6057] text-center py-4">Checking merchant responses...</p>
            ) : requests.length === 0 ? (
              <p className="text-xs text-[#4E6057] text-center py-4">No active inquiries yet.</p>
            ) : (
              requests.map((req) => (
                <div
                  key={req.id}
                  className="p-4 rounded-xl bg-white border border-[#DDE5D9] shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-[#DDE5D9] pb-2">
                    <div>
                      <span className="font-bold text-xs text-[#14201B]">{req.customerName}</span>
                      <span className="text-[11px] text-[#4E6057] ml-2">
                        · {req.area} · {formatDate(req.createdAt)}
                      </span>
                    </div>

                    <Badge
                      variant={req.replies.length > 0 ? 'grove' : 'subtle'}
                      size="sm"
                    >
                      {req.replies.length > 0
                        ? `${req.replies.length} Shops Replied`
                        : 'Awaiting Replies'}
                    </Badge>
                  </div>

                  <p className="font-display font-bold text-sm text-[#0E3B2C]">
                    "{req.text}"
                  </p>

                  {/* Merchant replies list */}
                  {req.replies.length > 0 && (
                    <div className="bg-[#F7F9F4] p-3 rounded-xl border border-[#DDE5D9] space-y-2">
                      <span className="text-[10px] uppercase font-bold text-[#4E6057] block">
                        Shop Responses:
                      </span>
                      <div className="space-y-1.5 text-xs">
                        {req.replies.map((rep, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-[#DDE5D9]"
                          >
                            <div className="flex items-center gap-2">
                              <Store className="w-3.5 h-3.5 text-[#1F6B4A]" />
                              <span className="font-bold text-[#14201B]">{rep.shopName}</span>
                            </div>

                            <div className="flex items-center gap-2">
                              {rep.available ? (
                                <span className="font-bold text-[#0E3B2C] bg-[#EEF3EA] px-2 py-0.5 rounded text-[11px]">
                                  In Stock: ₹{rep.price}
                                </span>
                              ) : (
                                <span className="text-[#D63A2F] text-[11px] font-semibold">
                                  Out of Stock
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
