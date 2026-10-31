import React, { useState, useEffect } from 'react';
import { Shop, Product, Offer } from '../../types';
import { ShelfStatus, ShelfGap } from '../../types/ml';
import { activeMLService as mockMLService } from '../../ml-sim/httpMLService';
import { formatCurrency } from '../../lib/format';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  Camera,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Scan,
  Layers,
  ArrowRight,
  ShieldCheck,
  Radio,
  Clock,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

interface OwnerSmartShelfTabProps {
  shop: Shop;
  products: Product[];
  offers: Offer[];
  onNavigateToStock?: () => void;
  onNavigateToReorder?: () => void;
}

interface ShelfEvent {
  id: string;
  time: string;
  text: string;
  type: 'info' | 'warning' | 'success';
}

export const OwnerSmartShelfTab: React.FC<OwnerSmartShelfTabProps> = ({
  shop,
  products,
  offers,
  onNavigateToStock,
  onNavigateToReorder,
}) => {
  const [selectedCamera, setSelectedCamera] = useState<'cam-1' | 'cam-2'>('cam-1');
  const [shelfStatus, setShelfStatus] = useState<ShelfStatus | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [autoScan, setAutoScan] = useState(true);
  const [restockTasks, setRestockTasks] = useState<{ id: string; slot: string; item: string; qty: number; status: 'pending' | 'done' }[]>([
    { id: 'task-1', slot: 'Rack-A2', item: 'Ponni Boiled Rice (1kg)', qty: 2, status: 'pending' },
  ]);
  const [events, setEvents] = useState<ShelfEvent[]>([
    { id: '1', time: '10:42 AM', text: 'Rack-A2: Ponni Rice empty slot detected (2 packs missing)', type: 'warning' },
    { id: '2', time: '10:20 AM', text: 'Camera 2: Cold-Pressed Oil shelf stock verified at 16 units', type: 'info' },
    { id: '3', time: '09:45 AM', text: 'Staff restock confirmed for Rack-B1 (Dal 1kg)', type: 'success' },
    { id: '4', time: '09:15 AM', text: 'Morning shelf audit completed across 4 zones', type: 'info' },
  ]);

  const loadShelfData = async (camId: string) => {
    setIsScanning(true);
    try {
      const data = await mockMLService.getShelfStatus(shop.id, camId);
      setShelfStatus(data);
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => setIsScanning(false), 800);
    }
  };

  useEffect(() => {
    loadShelfData(selectedCamera);
  }, [selectedCamera, shop.id]);

  // Periodic simulated shelf scan
  useEffect(() => {
    if (!autoScan) return;
    const interval = setInterval(() => {
      loadShelfData(selectedCamera);
    }, 12000);
    return () => clearInterval(interval);
  }, [autoScan, selectedCamera, shop.id]);

  const handleCreateRestockTask = (gap: ShelfGap) => {
    const prod = products.find((p) => p.id === gap.productId);
    const prodName = prod ? prod.name : gap.productId;
    const newTask = {
      id: `task-${Date.now()}`,
      slot: gap.slot,
      item: prodName,
      qty: gap.missing,
      status: 'pending' as const,
    };
    setRestockTasks((prev) => [newTask, ...prev]);
    setEvents((prev) => [
      {
        id: String(Date.now()),
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        text: `Staff restock alert created for ${gap.slot}: replenish ${gap.missing} units of ${prodName}`,
        type: 'warning',
      },
      ...prev,
    ]);
  };

  const handleCompleteTask = (taskId: string) => {
    setRestockTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: 'done' } : t))
    );
    setEvents((prev) => [
      {
        id: String(Date.now()),
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        text: 'Restock task marked completed by floor supervisor',
        type: 'success',
      },
      ...prev,
    ]);
  };

  // Reconciliation data (Shelf vs System)
  const reconciliationItems = [
    {
      slot: 'Rack-A1',
      productName: 'Ponni Boiled Rice (1kg)',
      systemQty: 14,
      cameraQty: 12,
      variance: -2,
      status: 'gap_detected',
      action: 'Check back-storage or shrinkage',
    },
    {
      slot: 'Rack-A2',
      productName: 'Sona Masoori Raw Rice (1kg)',
      systemQty: 10,
      cameraQty: 10,
      variance: 0,
      status: 'matched',
      action: 'Verified OK',
    },
    {
      slot: 'Rack-B1',
      productName: 'Pollachi Toor Dal (1kg)',
      systemQty: 15,
      cameraQty: 14,
      variance: -1,
      status: 'minor_diff',
      action: 'In customer basket or checkout',
    },
    {
      slot: 'Rack-C1',
      productName: 'Cold-Pressed Coconut Oil (1L)',
      systemQty: 16,
      cameraQty: 16,
      variance: 0,
      status: 'matched',
      action: 'Verified OK',
    },
    {
      slot: 'Rack-C2',
      productName: 'Palm Jaggery / Karupatti (500g)',
      systemQty: 20,
      cameraQty: 18,
      variance: -2,
      status: 'gap_detected',
      action: 'Restock from warehouse shelf',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner & Demo Disclaimer */}
      <div className="bg-gradient-to-r from-[#0E3B2C] to-[#1F6B4A] rounded-2xl p-6 text-white shadow-md border border-[#1F6B4A] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-[#FFB400]">
              <Scan className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display font-extrabold text-2xl tracking-tight">Smart Shelf CCTV Monitor</h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#FFB400] text-[#14201B]">
                  Simulated demo
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/20 text-white">
                  TRL 3
                </span>
              </div>
              <p className="text-xs text-white/80 mt-0.5">
                Simulated computer vision detecting physical gaps, box labels, and stock leakage in real-time.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setAutoScan(!autoScan)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
              autoScan
                ? 'bg-[#FFB400] text-[#14201B] border-[#FFB400]'
                : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
            }`}
          >
            <Radio className={`w-3.5 h-3.5 ${autoScan ? 'animate-pulse text-[#0E3B2C]' : ''}`} />
            <span>Auto-Scan: {autoScan ? 'ON (12s)' : 'PAUSED'}</span>
          </button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => loadShelfData(selectedCamera)}
            className="border-white/30 text-white hover:bg-white/10"
            disabled={isScanning}
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isScanning ? 'animate-spin' : ''}`} />
            <span>Scan Now</span>
          </Button>
        </div>
      </div>

      {/* Camera Selection & Live Feed Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Interactive Illustrated Camera Viewport */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-[#DDE5D9] shadow-xs space-y-4">
            {/* Camera Tabs */}
            <div className="flex items-center justify-between border-b border-[#DDE5D9] pb-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedCamera('cam-1')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                    selectedCamera === 'cam-1'
                      ? 'bg-[#0E3B2C] text-[#FFB400]'
                      : 'bg-[#F7F9F4] text-[#4E6057] hover:bg-[#EEF3EA]'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Cam 01: Grains & Staples</span>
                </button>

                <button
                  onClick={() => setSelectedCamera('cam-2')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                    selectedCamera === 'cam-2'
                      ? 'bg-[#0E3B2C] text-[#FFB400]'
                      : 'bg-[#F7F9F4] text-[#4E6057] hover:bg-[#EEF3EA]'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Cam 02: Oils & Sweets</span>
                </button>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-[#1F6B4A] font-bold">1080p Live Stream</span>
                <span className="text-[#4E6057]">· 15 fps</span>
              </div>
            </div>

            {/* Illustrated Shelf Visualizer (SVG Canvas with sweeping laser & bounding boxes) */}
            <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-[#14201B] border-2 border-[#1F6B4A] shadow-inner select-none">
              {/* Shelf Background Illustration */}
              <svg className="w-full h-full" viewBox="0 0 800 450" preserveAspectRatio="none">
                <defs>
                  {/* Wood/Metal rack gradients */}
                  <linearGradient id="rackGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2A3D34" />
                    <stop offset="100%" stopColor="#17241E" />
                  </linearGradient>
                  <linearGradient id="shelfBeam" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#3F554A" />
                    <stop offset="50%" stopColor="#536E61" />
                    <stop offset="100%" stopColor="#3F554A" />
                  </linearGradient>
                </defs>

                {/* Back Wall & Depth Grid */}
                <rect width="800" height="450" fill="#14201B" />
                <line x1="0" y1="90" x2="800" y2="90" stroke="#1E2F27" strokeWidth="1" strokeDasharray="4 4" />
                <line x1="0" y1="230" x2="800" y2="230" stroke="#1E2F27" strokeWidth="1" strokeDasharray="4 4" />
                <line x1="0" y1="370" x2="800" y2="370" stroke="#1E2F27" strokeWidth="1" strokeDasharray="4 4" />

                {/* Top Shelf Tier */}
                <rect x="30" y="190" width="740" height="18" rx="2" fill="url(#shelfBeam)" />
                {/* Bottom Shelf Tier */}
                <rect x="30" y="370" width="740" height="18" rx="2" fill="url(#shelfBeam)" />
                {/* Vertical Struts */}
                <rect x="30" y="20" width="16" height="400" fill="#24342C" />
                <rect x="390" y="20" width="16" height="400" fill="#24342C" />
                <rect x="754" y="20" width="16" height="400" fill="#24342C" />

                {/* Camera 1: Grains & Staples Items */}
                {selectedCamera === 'cam-1' && (
                  <>
                    {/* Top Shelf Left: Ponni Rice bags */}
                    <g transform="translate(60, 60)">
                      <rect x="10" y="30" width="60" height="95" rx="8" fill="#F4EDE4" stroke="#D3C7B6" strokeWidth="2" />
                      <rect x="80" y="30" width="60" height="95" rx="8" fill="#F4EDE4" stroke="#D3C7B6" strokeWidth="2" />
                      <rect x="150" y="30" width="60" height="95" rx="8" fill="#F4EDE4" stroke="#D3C7B6" strokeWidth="2" />
                      <text x="40" y="85" fill="#0E3B2C" fontSize="12" fontWeight="bold">RICE</text>
                      <text x="110" y="85" fill="#0E3B2C" fontSize="12" fontWeight="bold">RICE</text>
                      <text x="180" y="85" fill="#0E3B2C" fontSize="12" fontWeight="bold">RICE</text>
                      <text x="40" y="105" fill="#C57C00" fontSize="10">Ponni 1k</text>
                      <text x="110" y="105" fill="#C57C00" fontSize="10">Ponni 1k</text>
                      <text x="180" y="105" fill="#C57C00" fontSize="10">Ponni 1k</text>
                    </g>

                    {/* Top Shelf Right: Sona Masoori bags */}
                    <g transform="translate(420, 60)">
                      <rect x="10" y="30" width="65" height="95" rx="8" fill="#FFFBEB" stroke="#E2D5B5" strokeWidth="2" />
                      <rect x="85" y="30" width="65" height="95" rx="8" fill="#FFFBEB" stroke="#E2D5B5" strokeWidth="2" />
                      <rect x="160" y="30" width="65" height="95" rx="8" fill="#FFFBEB" stroke="#E2D5B5" strokeWidth="2" />
                      <text x="35" y="85" fill="#0E3B2C" fontSize="12" fontWeight="bold">MASOORI</text>
                      <text x="110" y="85" fill="#0E3B2C" fontSize="12" fontWeight="bold">MASOORI</text>
                      <text x="185" y="85" fill="#0E3B2C" fontSize="12" fontWeight="bold">MASOORI</text>
                      <text x="45" y="105" fill="#1F6B4A" fontSize="10">1kg bag</text>
                      <text x="120" y="105" fill="#1F6B4A" fontSize="10">1kg bag</text>
                      <text x="195" y="105" fill="#1F6B4A" fontSize="10">1kg bag</text>
                    </g>

                    {/* Bottom Shelf Left: Toor Dal packets */}
                    <g transform="translate(60, 240)">
                      <rect x="10" y="30" width="65" height="95" rx="6" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="2" />
                      <rect x="85" y="30" width="65" height="95" rx="6" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="2" />
                      <rect x="160" y="30" width="65" height="95" rx="6" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="2" />
                      <text x="35" y="85" fill="#92400E" fontSize="13" fontWeight="bold">TOOR</text>
                      <text x="110" y="85" fill="#92400E" fontSize="13" fontWeight="bold">TOOR</text>
                      <text x="185" y="85" fill="#92400E" fontSize="13" fontWeight="bold">TOOR</text>
                      <text x="42" y="105" fill="#B45309" fontSize="10">Dal 1kg</text>
                      <text x="117" y="105" fill="#B45309" fontSize="10">Dal 1kg</text>
                      <text x="192" y="105" fill="#B45309" fontSize="10">Dal 1kg</text>
                    </g>

                    {/* Bottom Shelf Right: GAP DETECTED AREA (Missing Rice bags!) */}
                    <g transform="translate(430, 240)">
                      {/* Outline for the empty slot with flashing Chilli warning */}
                      <rect
                        x="20"
                        y="30"
                        width="180"
                        height="95"
                        rx="6"
                        fill="rgba(214, 58, 47, 0.12)"
                        stroke="#D63A2F"
                        strokeWidth="2"
                        strokeDasharray="6 4"
                      />
                      <text x="45" y="75" fill="#D63A2F" fontSize="13" fontWeight="bold">
                        ⚠️ GAP DETECTED
                      </text>
                      <text x="50" y="95" fill="#FF8A80" fontSize="11">
                        Slot: Rack-A2 (2 Missing)
                      </text>
                      {/* One remaining item pushed to edge */}
                      <rect x="220" y="30" width="65" height="95" rx="8" fill="#F4EDE4" stroke="#D3C7B6" strokeWidth="2" />
                      <text x="240" y="85" fill="#0E3B2C" fontSize="12" fontWeight="bold">RICE</text>
                      <text x="240" y="105" fill="#C57C00" fontSize="10">1kg</text>
                    </g>
                  </>
                )}

                {/* Camera 2: Oils & Sweets Items */}
                {selectedCamera === 'cam-2' && (
                  <>
                    {/* Top Shelf: Oil Bottles */}
                    <g transform="translate(60, 60)">
                      <rect x="20" y="20" width="50" height="110" rx="10" fill="#FEF9C3" stroke="#CA8A04" strokeWidth="2" />
                      <rect x="90" y="20" width="50" height="110" rx="10" fill="#FEF9C3" stroke="#CA8A04" strokeWidth="2" />
                      <rect x="160" y="20" width="50" height="110" rx="10" fill="#FEF9C3" stroke="#CA8A04" strokeWidth="2" />
                      <rect x="230" y="20" width="50" height="110" rx="10" fill="#FEF9C3" stroke="#CA8A04" strokeWidth="2" />
                      <text x="35" y="80" fill="#854D0E" fontSize="11" fontWeight="bold">OIL</text>
                      <text x="105" y="80" fill="#854D0E" fontSize="11" fontWeight="bold">OIL</text>
                      <text x="175" y="80" fill="#854D0E" fontSize="11" fontWeight="bold">OIL</text>
                      <text x="245" y="80" fill="#854D0E" fontSize="11" fontWeight="bold">OIL</text>
                      <text x="28" y="100" fill="#A16207" fontSize="9">Cold-Press</text>
                      <text x="98" y="100" fill="#A16207" fontSize="9">Cold-Press</text>
                    </g>

                    {/* Bottom Shelf: Jaggery Bricks */}
                    <g transform="translate(60, 240)">
                      <rect x="20" y="35" width="80" height="85" rx="6" fill="#78350F" stroke="#92400E" strokeWidth="2" />
                      <rect x="120" y="35" width="80" height="85" rx="6" fill="#78350F" stroke="#92400E" strokeWidth="2" />
                      <rect x="220" y="35" width="80" height="85" rx="6" fill="#78350F" stroke="#92400E" strokeWidth="2" />
                      <text x="35" y="80" fill="#FEF3C7" fontSize="11" fontWeight="bold">KARUPATTI</text>
                      <text x="135" y="80" fill="#FEF3C7" fontSize="11" fontWeight="bold">KARUPATTI</text>
                      <text x="235" y="80" fill="#FEF3C7" fontSize="11" fontWeight="bold">KARUPATTI</text>
                      <text x="45" y="100" fill="#FDE68A" fontSize="9">500g Block</text>
                      <text x="145" y="100" fill="#FDE68A" fontSize="9">500g Block</text>
                    </g>
                  </>
                )}
              </svg>

              {/* Sweeping Laser Scanner Bar */}
              <div
                className={`absolute top-0 bottom-0 w-1 bg-gradient-to-r from-transparent via-[#FFB400] to-transparent pointer-events-none transition-all duration-300 shadow-[0_0_15px_#FFB400] ${
                  isScanning ? 'animate-[laserSweep_2.4s_ease-in-out_infinite]' : 'opacity-0'
                }`}
                style={{
                  left: isScanning ? '50%' : '0%',
                }}
              />

              {/* Bounding Boxes Overlay with Labels & Confidence Scores */}
              {shelfStatus?.boxes.map((box, i) => (
                <div
                  key={i}
                  className="absolute border-2 border-[#FFB400] bg-[#FFB400]/10 rounded-sm transition-all hover:bg-[#FFB400]/25 group"
                  style={{
                    left: `${box.bbox[0]}%`,
                    top: `${box.bbox[1]}%`,
                    width: `${box.bbox[2]}%`,
                    height: `${box.bbox[3]}%`,
                  }}
                >
                  {/* Confidence tag chip */}
                  <div className="absolute -top-6 left-0 bg-[#0E3B2C] text-[#FFB400] border border-[#FFB400]/40 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold flex items-center gap-1 shadow-md whitespace-nowrap">
                    <span>{box.label}</span>
                    <span className="text-white/80">· {box.qty} units</span>
                    <span className="text-[#38D39F] font-bold">({(box.confidence * 100).toFixed(0)}%)</span>
                  </div>
                </div>
              ))}

              {/* Missing Gap Callout & Action Overlay */}
              {shelfStatus?.gaps.map((gap, i) => (
                <div
                  key={i}
                  className="absolute border-2 border-dashed border-[#D63A2F] bg-[#D63A2F]/15 rounded-lg p-2 flex flex-col justify-between shadow-lg backdrop-blur-[1px]"
                  style={{
                    left: '53%',
                    top: '55%',
                    width: '27%',
                    height: '35%',
                  }}
                >
                  <div className="bg-[#D63A2F] text-white text-[10px] font-bold px-2 py-0.5 rounded self-start flex items-center gap-1 shadow-sm">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>2 PACKS MISSING</span>
                  </div>

                  <div className="bg-black/85 rounded-lg p-2 text-[10px] text-white backdrop-blur-sm flex items-center justify-between gap-1 shadow-md border border-white/10">
                    <div className="leading-tight">
                      <p className="font-bold text-[#FFB400] text-[11px] truncate">Ponni Rice 1kg</p>
                      <p className="text-white/70 text-[9px]">Rack-A2 gap detected</p>
                    </div>
                    <button
                      onClick={() => handleCreateRestockTask(gap)}
                      className="px-2.5 py-1 bg-[#D63A2F] hover:bg-[#B92B21] text-white text-[11px] rounded font-bold transition-transform active:scale-95 cursor-pointer shrink-0 shadow"
                    >
                      + Restock
                    </button>
                  </div>
                </div>
              ))}

              {/* Top Camera Status HUD */}
              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-md text-[11px] text-white flex items-center gap-2 border border-white/10 font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>CAMERA_ID: {selectedCamera.toUpperCase()}</span>
                <span className="text-white/50">|</span>
                <span>STATUS: INFERENCE_ONLINE</span>
              </div>

              <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-md text-[11px] text-white flex items-center gap-1.5 border border-white/10 font-mono">
                <Clock className="w-3 h-3 text-[#FFB400]" />
                <span>LAST_SYNC: 2 min ago</span>
              </div>
            </div>

            {/* Quick Actions Under Camera */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs">
              <div className="flex items-center gap-2 text-[#4E6057]">
                <ShieldCheck className="w-4 h-4 text-[#1F6B4A]" />
                <span>Detection model: <strong>Simulated YOLOv8 Edge</strong> (Pre-annotated grocery slots)</span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onNavigateToStock}
                  className="text-xs text-[#0E3B2C]"
                >
                  Open Stock Manager
                </Button>
                <Button
                  variant="palm"
                  size="sm"
                  onClick={onNavigateToReorder}
                  className="text-xs"
                >
                  Order Supplier Replenishment
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Active Restock Tasks & Event Feed */}
        <div className="space-y-4">
          {/* Staff Restock Task Queue */}
          <div className="bg-white rounded-2xl p-5 border border-[#DDE5D9] shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-[#DDE5D9] pb-2.5">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#0E3B2C]" />
                <h3 className="font-display font-bold text-base text-[#14201B]">Restock Queue</h3>
              </div>
              <Badge variant="subtle" size="sm">
                {restockTasks.filter((t) => t.status === 'pending').length} Pending
              </Badge>
            </div>

            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {restockTasks.length === 0 ? (
                <p className="text-xs text-[#4E6057] text-center py-4">No shelf restock tasks pending.</p>
              ) : (
                restockTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                      task.status === 'pending'
                        ? 'bg-[#FFFBFB] border-[#D63A2F]/40'
                        : 'bg-[#F7F9F4] border-[#DDE5D9] opacity-60'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-[#14201B]">
                        <span className="px-1.5 py-0.5 rounded bg-[#EEF3EA] text-[#0E3B2C] text-[10px]">
                          {task.slot}
                        </span>
                        <span>{task.item}</span>
                      </div>
                      <span className="text-[#4E6057] text-[11px] mt-0.5 block">
                        Need {task.qty} units from stock room
                      </span>
                    </div>

                    {task.status === 'pending' ? (
                      <button
                        onClick={() => handleCompleteTask(task.id)}
                        className="px-2.5 py-1 bg-[#1F6B4A] hover:bg-[#0E3B2C] text-white rounded-lg font-bold text-[11px] shrink-0 active:scale-95 transition-all"
                      >
                        Done
                      </button>
                    ) : (
                      <span className="text-[#1F6B4A] font-bold flex items-center gap-1 text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Filled
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Real-time CCTV Inference Feed */}
          <div className="bg-white rounded-2xl p-5 border border-[#DDE5D9] shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-[#DDE5D9] pb-2.5">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#0E3B2C]" />
                <h3 className="font-display font-bold text-base text-[#14201B]">Event Audit Log</h3>
              </div>
              <span className="text-[10px] uppercase font-bold text-[#4E6057]">Live Edge Feed</span>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {events.map((ev) => (
                <div key={ev.id} className="text-xs p-2 rounded-lg bg-[#F7F9F4] border border-[#DDE5D9] space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-[#4E6057]">
                    <span className="font-semibold">{ev.time}</span>
                    <span
                      className={`font-bold ${
                        ev.type === 'warning'
                          ? 'text-[#D63A2F]'
                          : ev.type === 'success'
                          ? 'text-[#1F6B4A]'
                          : 'text-[#0E3B2C]'
                      }`}
                    >
                      {ev.type.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-[#14201B] font-medium leading-relaxed">{ev.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Shelf vs System Reconciliation Table */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#DDE5D9] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#DDE5D9] pb-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display font-bold text-lg text-[#14201B]">
                Physical Shelf vs Digital POS Stock Reconciliation
              </h3>
              <Badge variant="subtle" size="sm">Audit Mode</Badge>
            </div>
            <p className="text-xs text-[#4E6057] mt-0.5">
              Identifies inventory shrinkage, misplaced packages, or missed customer billings automatically.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#1F6B4A] bg-[#EEF3EA] px-2.5 py-1 rounded-full">
              Overall Audit Accuracy: 96.4%
            </span>
          </div>
        </div>

        {/* Reconciliation Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-[#DDE5D9] bg-[#F7F9F4] text-[#4E6057] font-bold uppercase text-[11px]">
                <th className="py-2.5 px-3">Shelf Slot</th>
                <th className="py-2.5 px-3">Product Name</th>
                <th className="py-2.5 px-3 text-center">POS Recorded</th>
                <th className="py-2.5 px-3 text-center">Camera Seen</th>
                <th className="py-2.5 px-3 text-center">Variance</th>
                <th className="py-2.5 px-3">Audit Finding</th>
                <th className="py-2.5 px-3 text-right">Recommended Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DDE5D9]">
              {reconciliationItems.map((item, idx) => {
                const hasVariance = item.variance !== 0;
                return (
                  <tr key={idx} className={`hover:bg-[#F7F9F4]/60 ${hasVariance ? 'bg-[#FFFBFB]' : ''}`}>
                    <td className="py-3 px-3 font-mono font-bold text-[#0E3B2C]">{item.slot}</td>
                    <td className="py-3 px-3 font-semibold text-[#14201B]">{item.productName}</td>
                    <td className="py-3 px-3 text-center font-bold text-[#4E6057]">{item.systemQty} units</td>
                    <td className="py-3 px-3 text-center font-bold text-[#0E3B2C]">{item.cameraQty} units</td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full font-bold text-xs ${
                          item.variance === 0
                            ? 'bg-[#EEF3EA] text-[#1F6B4A]'
                            : 'bg-[#D63A2F]/15 text-[#D63A2F]'
                        }`}
                      >
                        {item.variance > 0 ? `+${item.variance}` : item.variance}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      {item.status === 'matched' && (
                        <span className="text-[#1F6B4A] font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> 100% Match
                        </span>
                      )}
                      {item.status === 'gap_detected' && (
                        <span className="text-[#D63A2F] font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" /> Gap on shelf
                        </span>
                      )}
                      {item.status === 'minor_diff' && (
                        <span className="text-[#FFB400] font-bold flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> In-transit
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right text-xs font-medium text-[#4E6057]">
                      {item.action}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
