import React, { useState, useEffect } from 'react';
import { Shop, Product, Offer } from '../../types';
import { ForecastPoint, ProductPair } from '../../types/ml';
import { formatCurrency } from '../../lib/format';
import { activeMLService as mockMLService } from '../../ml-sim/httpMLService';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import {
  Sparkles,
  TrendingUp,
  AlertCircle,
  Package,
  Layers,
  ArrowRight,
  Clock,
  Calendar,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

import { api } from '../../api';

interface OwnerInsightsTabProps {
  shop: Shop;
  offers: Offer[];
  products: Product[];
}

export const OwnerInsightsTab: React.FC<OwnerInsightsTabProps> = ({
  shop,
  offers,
  products,
}) => {
  const [forecast, setForecast] = useState<ForecastPoint[]>([]);
  const [associations, setAssociations] = useState<ProductPair[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('prod-1');
  const [lostDemandList, setLostDemandList] = useState<any[]>([
    { query: '40W LED Batten Light (Surge Protected)', count: 18, category: 'Hardware', potentialRevenue: 7200 },
    { query: 'Cold-Pressed Groundnut Oil 1L', count: 14, category: 'Grocery', potentialRevenue: 3360 },
    { query: 'N95 Reusable Face Mask (Pack of 5)', count: 11, category: 'Pharmacy', potentialRevenue: 1650 },
    { query: 'Long Handle Coconut Tree Pruning Sickle', count: 9, category: 'Hardware', potentialRevenue: 4500 },
    { query: 'Camlin 24 Shade Water Colour Cakes', count: 8, category: 'Stationery', potentialRevenue: 960 },
  ]);

  useEffect(() => {
    const loadMLInsights = async () => {
      const [fCast, assoc, ld] = await Promise.all([
        mockMLService.getDemandForecast(shop.id, selectedProduct, 7),
        mockMLService.getAssociations(shop.id),
        api.getLostDemand(),
      ]);
      setForecast(fCast);
      setAssociations(assoc);
      if (ld && ld.length > 0) {
        setLostDemandList(ld.map((item: any) => ({
          query: item.query,
          count: item.count || 1,
          category: item.category || 'General',
          potentialRevenue: item.potentialRevenue || ((item.count || 1) * 350),
        })));
      }
    };
    loadMLInsights();
  }, [shop.id, selectedProduct]);

  // Top sellers and dead stock
  const topSellers = [
    { name: 'Ponni Boiled Rice (1kg)', salesToday: 18, trend: '+24%' },
    { name: 'Pure Cold-Pressed Coconut Oil (1L)', salesToday: 12, trend: '+15%' },
    { name: 'Aachi Chilli Powder (200g)', salesToday: 16, trend: '+8%' },
    { name: 'Tata Salt (1kg)', salesToday: 22, trend: '+5%' },
  ];

  const slowMovers = [
    { name: 'Asian Paints Wall Putty (1kg)', daysNoSale: 34, suggestion: 'Bundle with Sandpaper or offer 10% discount' },
    { name: 'Stanley Steel Measuring Tape', daysNoSale: 28, suggestion: 'Move to checkout counter hardware display' },
    { name: 'Pure Cotton White Dhoti (4 Mulam)', daysNoSale: 25, suggestion: 'Feature during Friday temple festival' },
  ];

  // Heatmap hours vs days
  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const timeSlots = ['8 AM', '11 AM', '2 PM', '5 PM', '8 PM'];
  const heatIntensity = [
    [1, 3, 1, 3, 4], // Mon
    [1, 2, 1, 3, 3], // Tue
    [1, 2, 1, 2, 3], // Wed
    [2, 3, 1, 4, 4], // Thu
    [2, 4, 2, 5, 5], // Fri
    [4, 5, 3, 5, 5], // Sat (Peak)
    [3, 5, 3, 4, 4], // Sun (Morning peak)
  ];

  return (
    <div className="space-y-6">
      {/* Simulation Chip */}
      <div className="flex items-center justify-between bg-[#EEF3EA] border border-[#BDCBB8] px-4 py-2.5 rounded-xl text-xs text-[#0E3B2C]">
        <div className="flex items-center gap-2">
          <Badge variant="subtle" size="sm" className="bg-[#1F6B4A] text-white">
            Simulated demo
          </Badge>
          <span>
            Demand forecasting & market basket association rules generated using seeded time-series algorithms.
          </span>
        </div>
        <span className="font-mono text-[11px] text-[#4E6057]">AI Analytics TRL 3</span>
      </div>

      {/* 1. The Most Valuable Card: Lost Demand */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border-2 border-[#D63A2F]/40 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-[#D63A2F]" />
            <div>
              <h3 className="font-display font-bold text-lg text-[#14201B]">
                Lost Demand: Unstocked Items Customers Searched For
              </h3>
              <p className="text-xs text-[#4E6057]">
                Ranked by unique customer searches and "Can't find it?" requests with 0 local inventory.
              </p>
            </div>
          </div>
          <Badge variant="chilli" size="sm" className="font-bold">
            High Priority
          </Badge>
        </div>

        <div className="divide-y divide-[#DDE5D9] text-xs sm:text-sm">
          {lostDemandList.map((item, idx) => (
            <div
              key={idx}
              className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <div>
                <span className="font-bold text-[#14201B]">{item.query}</span>
                <div className="flex items-center gap-2 text-xs text-[#4E6057] mt-0.5">
                  <span>Category: {item.category}</span>
                  <span>•</span>
                  <span className="font-semibold text-[#D63A2F]">
                    {item.count} customers searched in Pollachi
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="font-display font-bold text-sm text-[#0E3B2C]">
                  ~{formatCurrency(item.potentialRevenue)} missed revenue
                </span>
                <button className="px-3 py-1 rounded-lg bg-[#EEF3EA] hover:bg-[#DDE5D9] text-[#0E3B2C] font-semibold text-xs transition-colors">
                  + Add to Catalog
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. 7-Day Demand Forecast with Confidence Band */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#DDE5D9] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#FFB400]" />
              <h3 className="font-display font-bold text-lg text-[#14201B]">
                7-Day Sales Demand Forecast
              </h3>
            </div>
            <p className="text-xs text-[#4E6057]">
              Predicted sales volume with upper and lower confidence bounds (Simulated demo).
            </p>
          </div>

          <select
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            className="px-3 py-1.5 bg-[#F7F9F4] border border-[#BDCBB8] rounded-xl text-xs font-semibold text-[#14201B]"
          >
            <option value="prod-1">Ponni Boiled Rice (1kg)</option>
            <option value="prod-2">Pure Coconut Oil (1L)</option>
            <option value="prod-11">Philips 9W LED Bulb</option>
          </select>
        </div>

        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={forecast} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEF3EA" />
              <XAxis dataKey="date" stroke="#4E6057" fontSize={12} />
              <YAxis stroke="#4E6057" fontSize={12} />
              <Tooltip
                formatter={(value: any, name: any) => [
                  `${value} units`,
                  name === 'high' ? 'Upper Bound' : name === 'low' ? 'Lower Bound' : 'Expected Sales',
                ]}
                contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #DDE5D9' }}
              />
              <Area type="monotone" dataKey="high" stroke="#BDCBB8" fill="#EEF3EA" fillOpacity={0.6} />
              <Area type="monotone" dataKey="expected" stroke="#0E3B2C" strokeWidth={2.5} fill="#1F6B4A" fillOpacity={0.15} />
              <Area type="monotone" dataKey="low" stroke="#BDCBB8" fill="#FFFFFF" fillOpacity={1} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. Frequently Bought Together Association Pairs */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#DDE5D9] shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#0E3B2C]" />
            <h3 className="font-display font-bold text-lg text-[#14201B]">
              Frequently Bought Together (Cross-Selling Opportunities)
            </h3>
          </div>
          <Badge variant="grove" size="sm">
            Association Rules
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {associations.map((pair, idx) => (
            <div
              key={idx}
              className="bg-[#F7F9F4] p-4 rounded-xl border border-[#DDE5D9] flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="font-bold text-sm text-[#14201B]">
                  {pair.productA} <span className="text-[#FFB400] font-extrabold">+</span> {pair.productB}
                </div>
                <span className="text-xs font-semibold text-[#1F6B4A] block mt-1">
                  Bought together {pair.frequency} times this month
                </span>
                <p className="text-xs text-[#4E6057] mt-2 italic">
                  💡 {pair.suggestion}
                </p>
              </div>

              <button className="text-xs font-bold text-[#0E3B2C] hover:underline flex items-center gap-1 self-start">
                <span>Create Combo Offer</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Time-of-Day & Day-of-Week Sales Heatmap Grid */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#DDE5D9] shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#0E3B2C]" />
            <h3 className="font-display font-bold text-lg text-[#14201B]">
              Weekly Store Footfall & Sales Heat Grid
            </h3>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-[#EEF3EA]"></span> Quiet</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-[#FFB400]"></span> Moderate</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-[#D63A2F]"></span> Busy Peak</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="grid grid-cols-6 gap-2 text-xs text-center min-w-[380px]">
            <div className="text-left font-bold text-[#4E6057]">Day</div>
            {timeSlots.map((ts) => (
              <div key={ts} className="font-bold text-[#4E6057]">
                {ts}
              </div>
            ))}

            {daysOfWeek.map((day, dIdx) => (
              <React.Fragment key={day}>
                <div className="text-left font-bold text-[#14201B] py-2">{day}</div>
                {timeSlots.map((_, tIdx) => {
                  const score = heatIntensity[dIdx][tIdx];
                  let bg = 'bg-[#EEF3EA] text-[#0E3B2C]';
                  if (score >= 4) bg = 'bg-[#D63A2F] text-white font-bold';
                  else if (score >= 3) bg = 'bg-[#FFB400] text-[#14201B] font-bold';

                  return (
                    <div
                      key={tIdx}
                      className={`h-9 rounded-lg flex items-center justify-center transition-all ${bg}`}
                      title={`${day} ${timeSlots[tIdx]}: Intensity ${score}/5`}
                    >
                      {score >= 4 ? '🔥 Peak' : score >= 3 ? 'Active' : 'Quiet'}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
