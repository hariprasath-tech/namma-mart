import React, { useState, useEffect } from 'react';
import { Shop, ItemRequest } from '../../types';
import { api } from '../../api';
import { formatDate } from '../../lib/format';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  MessageSquare,
  Send,
  CheckCircle2,
  Clock,
  MapPin,
  Sparkles,
  Search,
  Check,
  X,
  Phone,
} from 'lucide-react';

interface OwnerRequestsTabProps {
  shop: Shop;
}

export const OwnerRequestsTab: React.FC<OwnerRequestsTabProps> = ({ shop }) => {
  const [requests, setRequests] = useState<ItemRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyPrice, setReplyPrice] = useState<{ [reqId: string]: string }>({});
  const [replyAvailability, setReplyAvailability] = useState<{ [reqId: string]: boolean }>({});
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'replied'>('all');
  const [search, setSearch] = useState('');

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
    loadRequests();
  }, []);

  const handleSendReply = async (reqId: string) => {
    const isAvail = replyAvailability[reqId] !== undefined ? replyAvailability[reqId] : true;
    const priceVal = replyPrice[reqId] ? Number(replyPrice[reqId]) : undefined;

    setSubmittingId(reqId);
    try {
      const updated = await api.replyToRequest(reqId, {
        shopId: shop.id,
        shopName: shop.shortName || shop.name,
        price: isAvail ? priceVal : undefined,
        available: isAvail,
        replyAt: new Date().toISOString(),
      });

      setRequests((prev) => prev.map((r) => (r.id === reqId ? updated : r)));
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingId(null);
    }
  };

  const filteredRequests = requests.filter((r) => {
    const hasShopReplied = r.replies.some((rep) => rep.shopId === shop.id);
    if (filter === 'pending' && hasShopReplied) return false;
    if (filter === 'replied' && !hasShopReplied) return false;
    if (search && !r.text.toLowerCase().includes(search.toLowerCase()) && !r.area.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0E3B2C] to-[#1F6B4A] rounded-2xl p-6 text-white shadow-md border border-[#1F6B4A] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-[#FFB400]">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display font-extrabold text-2xl tracking-tight">
                  Customer "Can't Find It?" Live Requests
                </h2>
                <Badge variant="marigold" size="sm" className="font-bold">
                  {requests.length} Requests in Pollachi
                </Badge>
              </div>
              <p className="text-xs text-white/80 mt-0.5">
                Local shoppers looking for specific or out-of-stock items nearby. Win instant sales with 2-tap replies.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-[#DDE5D9] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filter === 'all'
                ? 'bg-[#0E3B2C] text-[#FFB400]'
                : 'bg-[#F7F9F4] text-[#4E6057] hover:bg-[#EEF3EA]'
            }`}
          >
            All Requests ({requests.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filter === 'pending'
                ? 'bg-[#0E3B2C] text-[#FFB400]'
                : 'bg-[#F7F9F4] text-[#4E6057] hover:bg-[#EEF3EA]'
            }`}
          >
            Awaiting Your Reply ({requests.filter((r) => !r.replies.some((rep) => rep.shopId === shop.id)).length})
          </button>
          <button
            onClick={() => setFilter('replied')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filter === 'replied'
                ? 'bg-[#0E3B2C] text-[#FFB400]'
                : 'bg-[#F7F9F4] text-[#4E6057] hover:bg-[#EEF3EA]'
            }`}
          >
            Replied ({requests.filter((r) => r.replies.some((rep) => rep.shopId === shop.id)).length})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-[#4E6057] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search request text..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-[#F7F9F4] border border-[#BDCBB8] rounded-xl text-xs focus:outline-[#0E3B2C]"
          />
        </div>
      </div>

      {/* Requests Stream */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-8 text-center text-[#4E6057]">Loading customer requests...</div>
        ) : filteredRequests.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center border border-[#DDE5D9] text-[#4E6057]">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40 text-[#0E3B2C]" />
            <p className="font-semibold">No requests match this filter.</p>
          </div>
        ) : (
          filteredRequests.map((req) => {
            const myReply = req.replies.find((r) => r.shopId === shop.id);
            const otherReplies = req.replies.filter((r) => r.shopId !== shop.id);

            return (
              <div
                key={req.id}
                className="bg-white rounded-2xl p-5 sm:p-6 border border-[#DDE5D9] shadow-xs space-y-4 hover:border-[#1F6B4A]/50 transition-all"
              >
                {/* Header info */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#DDE5D9] pb-3">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-[#EEF3EA] text-[#0E3B2C] font-bold text-xs flex items-center justify-center">
                      {req.customerName.slice(0, 1)}
                    </span>
                    <div>
                      <h3 className="font-display font-bold text-base text-[#14201B]">
                        {req.customerName}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-[#4E6057]">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[#FFB400]" /> {req.area}
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {formatDate(req.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {myReply ? (
                    <Badge variant="grove" size="sm" className="self-start sm:self-center">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Replied: {myReply.available ? `₹${myReply.price}` : 'Out of stock'}
                    </Badge>
                  ) : (
                    <Badge variant="marigold" size="sm" className="self-start sm:self-center">
                      Pending Your Response
                    </Badge>
                  )}
                </div>

                {/* Request Content */}
                <div className="bg-[#F7F9F4] rounded-xl p-4 border border-[#DDE5D9]">
                  <span className="text-[11px] uppercase font-bold text-[#4E6057] block mb-1">
                    Customer is asking for:
                  </span>
                  <p className="font-display font-bold text-lg text-[#0E3B2C]">
                    "{req.text}"
                  </p>
                </div>

                {/* Other Shop Responses */}
                {otherReplies.length > 0 && (
                  <div className="space-y-1.5 text-xs">
                    <span className="text-[#4E6057] font-semibold block text-[11px]">
                      Other shops responded:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {otherReplies.map((or, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-lg bg-[#EEF3EA] text-[#0E3B2C] border border-[#BDCBB8] font-medium"
                        >
                          {or.shopName}: {or.available ? `In Stock (₹${or.price})` : 'Unavailable'}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Owner Fast Reply Controls */}
                {!myReply ? (
                  <div className="bg-[#FFFBEB] rounded-xl p-4 border border-[#FFB400]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setReplyAvailability((prev) => ({ ...prev, [req.id]: true }))}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 border transition-all ${
                          replyAvailability[req.id] !== false
                            ? 'bg-[#0E3B2C] text-[#FFB400] border-[#0E3B2C]'
                            : 'bg-white text-[#4E6057] border-[#BDCBB8]'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>In Stock</span>
                      </button>

                      <button
                        onClick={() => setReplyAvailability((prev) => ({ ...prev, [req.id]: false }))}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 border transition-all ${
                          replyAvailability[req.id] === false
                            ? 'bg-[#D63A2F] text-white border-[#D63A2F]'
                            : 'bg-white text-[#4E6057] border-[#BDCBB8]'
                        }`}
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Not Available</span>
                      </button>

                      {replyAvailability[req.id] !== false && (
                        <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-[#BDCBB8]">
                          <span className="text-xs font-bold text-[#0E3B2C]">₹</span>
                          <input
                            type="number"
                            placeholder="Price"
                            value={replyPrice[req.id] || ''}
                            onChange={(e) =>
                              setReplyPrice((prev) => ({ ...prev, [req.id]: e.target.value }))
                            }
                            className="w-16 text-xs font-bold text-[#14201B] focus:outline-hidden"
                          />
                        </div>
                      )}
                    </div>

                    <Button
                      variant="palm"
                      size="sm"
                      onClick={() => handleSendReply(req.id)}
                      disabled={submittingId === req.id}
                      className="text-xs"
                    >
                      <Send className="w-3.5 h-3.5 mr-1.5" />
                      <span>{submittingId === req.id ? 'Sending...' : 'Send Quote to Customer'}</span>
                    </Button>
                  </div>
                ) : (
                  <div className="p-3 bg-[#EEF3EA] rounded-xl border border-[#BDCBB8] text-xs text-[#0E3B2C] flex items-center justify-between">
                    <span>
                      ✓ You offered this item for <strong>{myReply.available ? `₹${myReply.price}` : 'Unavailable'}</strong>. The customer has been notified.
                    </span>
                    <span className="text-[11px] text-[#4E6057]">
                      {formatDate(myReply.replyAt)}
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
