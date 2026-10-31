import React, { useState, useEffect } from 'react';
import { Shop } from '../../types';
import { CrowdSnapshot, ZoneDensity } from '../../types/ml';
import { activeMLService as mockMLService } from '../../ml-sim/httpMLService';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  Users,
  Clock,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  ShieldCheck,
  Play,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Eye,
  ShoppingBag,
  ExternalLink,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface OwnerCrowdTabProps {
  shop: Shop;
  onOpenDemo?: () => void;
}

interface ZoneMeta {
  id: string;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  baseDwell: number;
  topItem: string;
  topItemSold: number;
}

const FLOOR_ZONES: ZoneMeta[] = [
  { id: 'grocery', name: 'Grocery & Rice', x: 20, y: 20, w: 220, h: 140, baseDwell: 9.5, topItem: 'Ponni Rice 1kg', topItemSold: 28 },
  { id: 'dairy', name: 'Dairy & Milks', x: 260, y: 20, w: 180, h: 140, baseDwell: 5.8, topItem: 'Aavin Green Milk 500ml', topItemSold: 42 },
  { id: 'veg', name: 'Fruits & Veg', x: 460, y: 20, w: 200, h: 140, baseDwell: 8.2, topItem: 'Pollachi Tender Coconut', topItemSold: 35 },
  { id: 'electronics', name: 'Electronics & Lamps', x: 680, y: 20, w: 180, h: 260, baseDwell: 14.2, topItem: 'Philips 9W LED Bulb', topItemSold: 12 },
  { id: 'home', name: 'Home Needs & Kitchen', x: 20, y: 180, w: 220, h: 180, baseDwell: 11.0, topItem: 'Prestige 3L Cooker', topItemSold: 6 },
  { id: 'fashion', name: 'Clothing & Towels', x: 260, y: 180, w: 180, h: 180, baseDwell: 16.5, topItem: 'Handloom Cotton Dhoti', topItemSold: 14 },
  { id: 'stationery', name: 'Stationery & Books', x: 460, y: 180, w: 200, h: 180, baseDwell: 7.0, topItem: 'Classmate 192p Notebook', topItemSold: 19 },
  { id: 'billing', name: 'Billing Counters & Exit', x: 20, y: 375, w: 840, h: 85, baseDwell: 5.5, topItem: 'Impulse Candy / Gums', topItemSold: 54 },
];

export const OwnerCrowdTab: React.FC<OwnerCrowdTabProps> = ({ shop, onOpenDemo }) => {
  const [crowd, setCrowd] = useState<CrowdSnapshot | null>(null);
  const [zoneDensities, setZoneDensities] = useState<ZoneDensity[]>([]);
  const [selectedZone, setSelectedZone] = useState<ZoneMeta | null>(FLOOR_ZONES[0]);
  const [sliderHour, setSliderHour] = useState<number>(18); // Default 6 PM peak
  const [isReplaying, setIsReplaying] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      const snap = await mockMLService.getCrowd(shop.id);
      const zones = await mockMLService.getZoneDensity(shop.id);
      if (isMounted) {
        setCrowd(snap);
        setZoneDensities(zones);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [shop.id]);

  // Hourly multiplier based on time-slider
  const getHourMultiplier = (hr: number) => {
    if (hr < 9 || hr > 21) return 0.2;
    if (hr >= 9 && hr <= 12) return 1.2; // Morning rush
    if (hr >= 13 && hr <= 15) return 0.5; // Afternoon lull
    if (hr >= 17 && hr <= 20) return 1.6; // Evening peak
    return 0.8;
  };

  const currentMultiplier = getHourMultiplier(sliderHour);

  // Replay animation effect
  useEffect(() => {
    if (!isReplaying) return;
    const timer = setInterval(() => {
      setSliderHour((prev) => {
        if (prev >= 21) {
          setIsReplaying(false);
          return 9;
        }
        return prev + 1;
      });
    }, 900);
    return () => clearInterval(timer);
  }, [isReplaying]);

  // Simulated Entries and Exits data over last 60 minutes
  const footfallTrend = [
    { time: '10:00', entries: 14, exits: 6, net: 8 },
    { time: '10:10', entries: 18, exits: 9, net: 9 },
    { time: '10:20', entries: 22, exits: 12, net: 10 },
    { time: '10:30', entries: 19, exits: 15, net: 4 },
    { time: '10:40', entries: 26, exits: 18, net: 8 },
    { time: '10:50', entries: 31, exits: 20, net: 11 },
    { time: '11:00', entries: 28, exits: 22, net: 6 },
  ];

  // Helper to get color and density status for a zone
  const getZoneDensityState = (zoneId: string) => {
    const defaultCount = zoneId === 'dairy' ? 18 : zoneId === 'grocery' ? 14 : zoneId === 'billing' ? 12 : 7;
    const baseCount = (zoneDensities.find((z) => z.zoneId === zoneId)?.count || defaultCount);
    const scaledCount = Math.round(baseCount * currentMultiplier);

    let color = '#2E7D32'; // quiet green
    let level: 'quiet' | 'moderate' | 'busy' = 'quiet';

    if (scaledCount >= 18) {
      color = '#D63A2F'; // busy chilli
      level = 'busy';
    } else if (scaledCount >= 10) {
      color = '#FFB400'; // moderate marigold
      level = 'moderate';
    }

    return { count: scaledCount, color, level };
  };

  const isDepartmentStore = shop.type === 'department';

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0E3B2C] to-[#1F6B4A] rounded-2xl p-6 text-white shadow-md border border-[#1F6B4A] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-[#FFB400]">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display font-extrabold text-2xl tracking-tight">Crowd & Queue Intelligence</h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#FFB400] text-[#14201B]">
                  Simulated demo
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/20 text-white">
                  TRL 3
                </span>
              </div>
              <p className="text-xs text-white/80 mt-0.5">
                Simulated floor plan heat zones, queue wait bottlenecks, and staff deployment triggers.
              </p>
            </div>
          </div>
        </div>

        {/* Link to in-browser local COCO-SSD person counting demo */}
        <div className="flex items-center gap-3">
          {onOpenDemo && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenDemo}
              className="border-[#FFB400] text-[#FFB400] hover:bg-white/10"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              <span>Try In-Browser Person Detector</span>
            </Button>
          )}
        </div>
      </div>

      {!isDepartmentStore && (
        <div className="p-4 bg-[#FFFBEB] border border-[#FFB400] rounded-xl text-xs text-[#854D0E] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#FFB400] shrink-0" />
            <span>
              <strong>Note:</strong> {shop.name} is classified as a small retail shop. The full 8-zone floor plan heatmap below is active in demo mode to preview Department Store capabilities (switch to <em>Pollachi Super Centre</em> for full multi-department telemetry).
            </span>
          </div>
        </div>
      )}

      {/* KPI Cards: Live Footfall, Wait Times, Peak hour */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-[#DDE5D9] shadow-xs">
          <span className="text-xs font-bold uppercase text-[#4E6057] block">People in Store Now</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="font-display text-3xl font-extrabold text-[#0E3B2C]">
              {Math.round((crowd?.peopleNow || 42) * currentMultiplier)}
            </span>
            <span className="text-xs font-semibold text-[#1F6B4A]">
              {(crowd?.level || 'moderate').toUpperCase()}
            </span>
          </div>
          <span className="text-[11px] text-[#4E6057] mt-1 block">
            Occupancy: {Math.round(((crowd?.peopleNow || 42) * currentMultiplier / 120) * 100)}% of safe limit (120)
          </span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#DDE5D9] shadow-xs">
          <span className="text-xs font-bold uppercase text-[#4E6057] block">Billing Queue Wait</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="font-display text-3xl font-extrabold text-[#FFB400]">
              ~{Math.round(4 * currentMultiplier)} min
            </span>
            <span className="text-xs text-[#4E6057]">avg wait</span>
          </div>
          <span className="text-[11px] text-[#4E6057] mt-1 block">
            Active Counters: 2 of 4 open
          </span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#DDE5D9] shadow-xs">
          <span className="text-xs font-bold uppercase text-[#4E6057] block">Avg Customer Dwell</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="font-display text-3xl font-extrabold text-[#14201B]">
              12.4 min
            </span>
            <span className="text-xs font-semibold text-[#1F6B4A] flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> +1.2m
            </span>
          </div>
          <span className="text-[11px] text-[#4E6057] mt-1 block">
            Highest in Clothing & Electronics
          </span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#DDE5D9] shadow-xs">
          <span className="text-xs font-bold uppercase text-[#4E6057] block">Staffing Status</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="font-display text-2xl font-bold text-[#D63A2F]">
              Action Needed
            </span>
          </div>
          <span className="text-[11px] text-[#4E6057] mt-1 block">
            Dairy aisle congestion (18+ shoppers)
          </span>
        </div>
      </div>

      {/* Main Floor Plan SVG Heatmap & Inspector */}
      <div className="bg-white rounded-2xl p-6 border border-[#DDE5D9] shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#DDE5D9] pb-4">
          <div>
            <h3 className="font-display font-bold text-lg text-[#14201B] flex items-center gap-2">
              <span>Interactive Store Floor Plan & Zone Heatmap</span>
              <span className="text-xs font-normal text-[#4E6057]">(Click any section to inspect)</span>
            </h3>
            <p className="text-xs text-[#4E6057] mt-0.5">
              Colors represent shopper concentration: Green (Quiet), Yellow (Moderate), Red (Crowded/Bottleneck).
            </p>
          </div>

          {/* Time of Day Replay Slider */}
          <div className="flex items-center gap-3 bg-[#F7F9F4] px-4 py-2 rounded-xl border border-[#DDE5D9]">
            <button
              onClick={() => setIsReplaying(!isReplaying)}
              className="p-1 rounded-lg bg-white border border-[#DDE5D9] hover:bg-[#EEF3EA] text-[#0E3B2C] active:scale-95"
              title={isReplaying ? 'Pause' : 'Play day replay'}
            >
              {isReplaying ? <RotateCcw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            </button>
            <div className="flex flex-col">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-[#4E6057]">Simulated Hour:</span>
                <span className="font-bold text-[#0E3B2C]">
                  {sliderHour > 12 ? `${sliderHour - 12} PM` : `${sliderHour} AM`}
                </span>
              </div>
              <input
                type="range"
                min="9"
                max="21"
                step="1"
                value={sliderHour}
                onChange={(e) => setSliderHour(Number(e.target.value))}
                className="w-36 h-1.5 bg-[#DDE5D9] rounded-lg accent-[#0E3B2C] cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Floor Plan Canvas */}
        <div className="relative w-full overflow-x-auto">
          <svg
            viewBox="0 0 880 500"
            className="w-full h-auto min-w-[720px] rounded-xl border border-[#BDCBB8] bg-[#F7F9F4] shadow-inner select-none"
          >
            {/* Grid background */}
            <defs>
              <pattern id="smallGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#E5ECE2" strokeWidth="0.8" />
              </pattern>
            </defs>
            <rect width="880" height="500" fill="url(#smallGrid)" />

            {/* Outer Store Walls */}
            <rect x="10" y="10" width="860" height="480" rx="8" fill="none" stroke="#1F6B4A" strokeWidth="3" />

            {/* Entrance / Exit Gate */}
            <rect x="360" y="470" width="160" height="20" rx="10" fill="#0E3B2C" />
            <path d="M 390 490 L 490 490" stroke="#FFB400" strokeWidth="4" strokeLinecap="round" />
            <text x="440" y="484" textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="bold" letterSpacing="1">
              MAIN ENTRANCE / EXIT
            </text>

            {/* Render Each Zone */}
            {FLOOR_ZONES.map((zone) => {
              const { count, color, level } = getZoneDensityState(zone.id);
              const isSelected = selectedZone?.id === zone.id;
              const isHot = level === 'busy';

              return (
                <g
                  key={zone.id}
                  onClick={() => setSelectedZone(zone)}
                  className="cursor-pointer transition-all duration-300"
                >
                  {/* Zone Background Box with breathing animation if hot */}
                  <rect
                    x={zone.x}
                    y={zone.y}
                    width={zone.w}
                    height={zone.h}
                    rx="8"
                    fill={color}
                    fillOpacity={isSelected ? 0.35 : 0.22}
                    stroke={isSelected ? '#0E3B2C' : color}
                    strokeWidth={isSelected ? 3 : 1.5}
                    className={isHot ? 'animate-pulse' : ''}
                  />

                  {/* Zone Header Label */}
                  <text
                    x={zone.x + 12}
                    y={zone.y + 24}
                    fill="#14201B"
                    fontSize="13"
                    fontWeight="bold"
                    className="select-none"
                  >
                    {zone.name}
                  </text>

                  {/* Shopper Count Badge */}
                  <rect
                    x={zone.x + zone.w - 75}
                    y={zone.y + 12}
                    width="65"
                    height="22"
                    rx="11"
                    fill={color}
                  />
                  <text
                    x={zone.x + zone.w - 42}
                    y={zone.y + 27}
                    textAnchor="middle"
                    fill="#FFFFFF"
                    fontSize="11"
                    fontWeight="bold"
                  >
                    {count} people
                  </text>

                  {/* Mini zone metadata */}
                  <text
                    x={zone.x + 12}
                    y={zone.y + zone.h - 14}
                    fill="#4E6057"
                    fontSize="10"
                    fontWeight="500"
                  >
                    Avg Dwell: {zone.baseDwell}m · Top: {zone.topItem.slice(0, 14)}...
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Zone Inspector Box (Shows details of clicked zone) */}
        {selectedZone && (
          <div className="bg-[#EEF3EA] rounded-xl p-4 border border-[#BDCBB8] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-base text-[#0E3B2C]">
                  Zone Selected: {selectedZone.name}
                </span>
                <Badge variant="palm" size="sm">
                  {getZoneDensityState(selectedZone.id).count} Shoppers Currently
                </Badge>
              </div>
              <p className="text-xs text-[#4E6057]">
                Average aisle dwell time: <strong>{selectedZone.baseDwell} minutes</strong>. Shoppers in this aisle spend 40% more time than store average.
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <div className="bg-white px-3 py-2 rounded-lg border border-[#DDE5D9]">
                <span className="text-[#4E6057] block text-[10px] uppercase font-bold">Best-Selling Product</span>
                <span className="font-bold text-[#14201B]">{selectedZone.topItem}</span>
                <span className="text-[#1F6B4A] font-semibold block">{selectedZone.topItemSold} units moved today</span>
              </div>

              <div className="bg-white px-3 py-2 rounded-lg border border-[#DDE5D9]">
                <span className="text-[#4E6057] block text-[10px] uppercase font-bold">Shelf Conversion</span>
                <span className="font-bold text-[#0E3B2C]">74.2%</span>
                <span className="text-[#4E6057] block text-[10px]">High purchase intent</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Billing Queue Monitor & Staffing Recommendation Card */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Billing Counter Monitor */}
        <div className="bg-white rounded-2xl p-5 border border-[#DDE5D9] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#DDE5D9] pb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#0E3B2C]" />
              <h3 className="font-display font-bold text-base text-[#14201B]">Billing Counter Monitor</h3>
            </div>
            <Badge variant="subtle" size="sm">Real-time Vision</Badge>
          </div>

          <div className="space-y-3">
            <div className="p-3 rounded-xl border border-[#DDE5D9] bg-[#F7F9F4] flex items-center justify-between">
              <div>
                <span className="font-bold text-sm text-[#14201B]">Counter 1 (Express & UPI)</span>
                <span className="text-xs text-[#4E6057] block mt-0.5">Queue: 3 customers · Wait: ~2 mins</span>
              </div>
              <Badge variant="grove" size="sm">🟢 Flow Normal</Badge>
            </div>

            <div className="p-3 rounded-xl border border-[#FFB400] bg-[#FFFBEB] flex items-center justify-between">
              <div>
                <span className="font-bold text-sm text-[#14201B]">Counter 2 (Regular Baskets)</span>
                <span className="text-xs text-[#854D0E] block mt-0.5">Queue: 7 customers · Wait: ~6.5 mins</span>
              </div>
              <Badge variant="marigold" size="sm">🟡 Moderate Delay</Badge>
            </div>

            <div className="p-3 rounded-xl border border-[#D63A2F]/40 bg-[#FFFBFB] flex items-center justify-between">
              <div>
                <span className="font-bold text-sm text-[#14201B]">Counter 3 (Standby)</span>
                <span className="text-xs text-[#D63A2F] block mt-0.5">Closed · Recommended to open</span>
              </div>
              <button
                onClick={() => alert('Counter 3 activation alert sent to floor manager terminal.')}
                className="px-3 py-1 bg-[#D63A2F] hover:bg-[#B92B21] text-white text-xs font-bold rounded-lg transition-transform active:scale-95"
              >
                Open Counter 3
              </button>
            </div>
          </div>
        </div>

        {/* Smart Staffing Suggestion Card */}
        <div className="bg-white rounded-2xl p-5 border border-[#DDE5D9] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#DDE5D9] pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#FFB400]" />
              <h3 className="font-display font-bold text-base text-[#14201B]">Smart Staffing Dispatch</h3>
            </div>
            <span className="text-[10px] font-bold uppercase text-[#FFB400] bg-[#FFB400]/15 px-2 py-0.5 rounded-full">
              Simulated Forecast
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-xl bg-[#EEF3EA] border border-[#BDCBB8] space-y-1">
              <div className="flex items-center justify-between font-bold text-[#0E3B2C]">
                <span>Dairy & Fruits (6:00 PM - 8:00 PM)</span>
                <Badge variant="palm" size="sm">High Priority</Badge>
              </div>
              <p className="text-[#4E6057]">
                Evening footfall surge predicted: add <strong>1 staff member to Dairy</strong> to restock milk packets and weigh vegetables before queues build.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F7F9F4] border border-[#DDE5D9] space-y-1">
              <div className="flex items-center justify-between font-bold text-[#14201B]">
                <span>Billing Standby (5:30 PM)</span>
                <span className="text-[#FFB400] font-bold">Pre-emptive Alert</span>
              </div>
              <p className="text-[#4E6057]">
                Station an extra cashier at Counter 3 starting at 5:30 PM to keep peak checkout wait under 4 minutes.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Demand Ranking: Top 10 Products by Sales vs Viewed-But-Not-Bought */}
      <div className="bg-white rounded-2xl p-6 border border-[#DDE5D9] shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#DDE5D9] pb-3">
          <div>
            <h3 className="font-display font-bold text-lg text-[#14201B]">
              Customer Demand & Shelf Conversion Matrix
            </h3>
            <p className="text-xs text-[#4E6057] mt-0.5">
              Identifies top sellers vs products with high footfall dwell but low checkout conversion (friction detection).
            </p>
          </div>
          <Badge variant="subtle" size="sm">Pollachi Store Analytics</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Top 5 Sellers by Volume */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase text-[#1F6B4A] block">
              🏆 Top Sellers Today
            </span>
            <div className="space-y-2 text-xs">
              {[
                { name: 'Ponni Boiled Rice (1kg)', sales: 38, revenue: 1976 },
                { name: 'Pure Cold-Pressed Coconut Oil (1L)', sales: 26, revenue: 5460 },
                { name: 'Pollachi Toor Dal (1kg)', sales: 24, revenue: 3840 },
                { name: 'Palm Jaggery / Karupatti (500g)', sales: 18, revenue: 3240 },
                { name: 'Philips 9W LED Bulb', sales: 14, revenue: 1540 },
              ].map((p, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-[#F7F9F4] border border-[#DDE5D9]">
                  <span className="font-semibold text-[#14201B]">{i + 1}. {p.name}</span>
                  <div className="text-right">
                    <span className="font-bold text-[#0E3B2C]">{p.sales} units</span>
                    <span className="text-[#4E6057] text-[10px] block">₹{p.revenue}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* High Interest / Low Conversion */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase text-[#D63A2F] block">
              ⚠️ High Interest / Low Conversion (Check Price or Placement)
            </span>
            <div className="space-y-2 text-xs">
              {[
                { name: 'Prestige 3L Pressure Cooker', dwellCount: 32, bought: 3, hint: 'Price ₹1,450 is ₹80 higher than nearby Sakthi Mart' },
                { name: 'Handloom Cotton Dhoti (Double)', dwellCount: 28, bought: 4, hint: 'Shoppers check fabric but ask for colored borders' },
                { name: 'Erode Turmeric Powder (500g)', dwellCount: 22, bought: 5, hint: 'Shelf position is too high (reach friction)' },
              ].map((p, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-[#FFFBFB] border border-[#D63A2F]/30 space-y-1">
                  <div className="flex items-center justify-between font-semibold text-[#14201B]">
                    <span>{p.name}</span>
                    <span className="text-xs font-bold text-[#D63A2F]">{p.dwellCount} examined → {p.bought} bought</span>
                  </div>
                  <p className="text-[11px] text-[#854D0E] font-medium">💡 Recommendation: {p.hint}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Ethics & Privacy Panel (Viva Mark Essential) */}
      <div className="bg-[#14201B] rounded-2xl p-5 text-white border border-[#2A3D34] flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-[#FFB400] shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs">
          <p className="font-bold text-[#FFB400] text-sm">Privacy & Ethics Compliance Notice</p>
          <p className="text-white/80 leading-relaxed">
            <strong>No faces or biometric personal identifiers are ever captured or stored.</strong> The computer vision layer processes frames locally on the store edge gateway and generates only aggregate centroid counts and polygon dwell coordinates. CCTV feeds never leave the store's physical premises.
          </p>
        </div>
      </div>
    </div>
  );
};
