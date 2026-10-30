import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import { GroupOrder } from '../../types';
import { formatCurrency } from '../../lib/format';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  Users,
  TrendingDown,
  Truck,
  CheckCircle2,
  Clock,
  Sparkles,
  MapPin,
} from 'lucide-react';

interface GroupOrderCardProps {
  onOrderJoined?: (group: GroupOrder) => void;
}

export const GroupOrderCard: React.FC<GroupOrderCardProps> = ({ onOrderJoined }) => {
  const [groupOrders, setGroupOrders] = useState<GroupOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState<string | null>(null);

  useEffect(() => {
    api.getGroupOrders().then((data) => {
      setGroupOrders(data);
      setLoading(false);
    });
  }, []);

  const handleJoin = async (groupId: string) => {
    setJoiningId(groupId);
    try {
      const updated = await api.joinGroupOrder(groupId);
      setGroupOrders((prev) => prev.map((g) => (g.id === groupId ? updated : g)));
      if (onOrderJoined) onOrderJoined(updated);
    } catch (e) {
      console.error(e);
    } finally {
      setJoiningId(null);
    }
  };

  if (loading || groupOrders.length === 0) return null;

  const activeGroup = groupOrders[0];
  const progressPercent = Math.min(100, Math.round((activeGroup.joined / activeGroup.target) * 100));

  return (
    <div className="bg-white rounded-2xl p-5 border border-[#DDE5D9] shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#DDE5D9] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#EEF3EA] flex items-center justify-center text-[#0E3B2C]">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display font-bold text-base text-[#14201B]">
                Neighbourhood Group Delivery
              </h3>
              <Badge variant="grove" size="sm" className="font-bold">
                Fee Splitting Active
              </Badge>
            </div>
            <p className="text-xs text-[#4E6057] mt-0.5 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-[#FFB400]" />
              {activeGroup.area} · Ordering from {activeGroup.shopName}
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[11px] text-[#4E6057] block uppercase font-bold">Delivery Fee</span>
          <div className="flex items-baseline gap-1.5 justify-end">
            <span className="font-display font-extrabold text-lg text-[#0E3B2C]">
              {formatCurrency(activeGroup.currentFee)}
            </span>
            <span className="text-xs text-[#4E6057] line-through">
              {formatCurrency(activeGroup.baseFee)}
            </span>
          </div>
        </div>
      </div>

      {/* Progress Bar of Joined Neighbours */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-semibold">
          <span className="text-[#0E3B2C]">
            👥 {activeGroup.joined} of {activeGroup.target} neighbours joined
          </span>
          <span className="text-[#1F6B4A] flex items-center gap-1">
            <TrendingDown className="w-3 h-3" /> Fee drops to ₹{Math.max(5, Math.round(activeGroup.baseFee / (activeGroup.joined + 1)))} on next join
          </span>
        </div>

        <div className="w-full h-2.5 bg-[#EEF3EA] rounded-full overflow-hidden border border-[#BDCBB8]">
          <div
            className="h-full bg-gradient-to-r from-[#1F6B4A] to-[#FFB400] transition-all duration-500 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Join Action Button */}
      <div className="flex items-center justify-between pt-1 text-xs">
        <span className="text-[#4E6057]">
          Delivery window: <strong>Today 6:30 PM - 7:30 PM</strong>
        </span>

        <Button
          variant="marigold"
          size="sm"
          onClick={() => handleJoin(activeGroup.id)}
          disabled={joiningId === activeGroup.id}
          className="font-bold text-xs"
        >
          <Truck className="w-3.5 h-3.5 mr-1.5" />
          <span>{joiningId === activeGroup.id ? 'Joining...' : 'Join Street Delivery Pool'}</span>
        </Button>
      </div>
    </div>
  );
};
