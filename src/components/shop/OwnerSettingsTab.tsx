import React, { useState } from 'react';
import { Shop } from '../../types';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  Store,
  MapPin,
  Clock,
  Truck,
  ShieldCheck,
  Camera,
  Download,
  Save,
  CheckCircle2,
  FileText,
  Radio,
  Sliders,
} from 'lucide-react';

interface OwnerSettingsTabProps {
  shop: Shop;
}

export const OwnerSettingsTab: React.FC<OwnerSettingsTabProps> = ({ shop }) => {
  const [storeName, setStoreName] = useState(shop.name);
  const [shortName, setShortName] = useState(shop.shortName || '');
  const [phone, setPhone] = useState(shop.phone);
  const [hours, setHours] = useState(shop.hours);
  const [address, setAddress] = useState(shop.address);
  const [deliveryRadius, setDeliveryRadius] = useState('5.0');
  const [deliveryTime, setDeliveryTime] = useState('30');
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const exportAllData = () => {
    const backup = {
      shopId: shop.id,
      name: shop.name,
      exportDate: new Date().toISOString(),
      version: 'LocalKart v2 (TRL 3)',
      status: 'Academic Viva Demo Package',
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${shop.shortName || 'shop'}-data-export.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0E3B2C] to-[#1F6B4A] rounded-2xl p-6 text-white shadow-md border border-[#1F6B4A] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-[#FFB400]">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display font-extrabold text-2xl tracking-tight">Store Profile & Edge Settings</h2>
                <Badge variant="grove" size="sm" className="bg-[#1F6B4A] text-white border border-white/20">
                  Verified Local Merchant
                </Badge>
              </div>
              <p className="text-xs text-white/80 mt-0.5">
                Configure operational hours, map label, edge cameras, and privacy disclaimers.
              </p>
            </div>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={exportAllData}
          className="border-white/30 text-white hover:bg-white/10"
        >
          <Download className="w-3.5 h-3.5 mr-1.5" />
          <span>Export Store Backup (JSON)</span>
        </Button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Basic Shop Information */}
        <div className="bg-white rounded-2xl p-6 border border-[#DDE5D9] shadow-xs space-y-4">
          <h3 className="font-display font-bold text-lg text-[#14201B] border-b border-[#DDE5D9] pb-3">
            Merchant & Map Profile
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase text-[#4E6057] block mb-1">
                Full Legal / Registered Shop Name
              </label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F7F9F4] border border-[#BDCBB8] rounded-xl text-sm focus:outline-[#0E3B2C]"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase text-[#4E6057] block mb-1">
                Short Name on Map Pills (Max 16 Chars)
              </label>
              <input
                type="text"
                maxLength={16}
                value={shortName}
                onChange={(e) => setShortName(e.target.value)}
                placeholder="e.g. Royal Home"
                className="w-full px-3.5 py-2.5 bg-[#F7F9F4] border border-[#BDCBB8] rounded-xl text-sm focus:outline-[#0E3B2C]"
              />
              <span className="text-[11px] text-[#4E6057] mt-0.5 block">
                Prevents text clipping on map pins. Full name is displayed in bottom sheets.
              </span>
            </div>

            <div>
              <label className="text-xs font-bold uppercase text-[#4E6057] block mb-1">
                Owner Phone (WhatsApp / Calls)
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F7F9F4] border border-[#BDCBB8] rounded-xl text-sm focus:outline-[#0E3B2C]"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase text-[#4E6057] block mb-1">
                Operating Hours
              </label>
              <input
                type="text"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F7F9F4] border border-[#BDCBB8] rounded-xl text-sm focus:outline-[#0E3B2C]"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-bold uppercase text-[#4E6057] block mb-1">
                Physical Street Address (Pollachi)
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F7F9F4] border border-[#BDCBB8] rounded-xl text-sm focus:outline-[#0E3B2C]"
              />
            </div>
          </div>
        </div>

        {/* Delivery & Pickup Configuration */}
        <div className="bg-white rounded-2xl p-6 border border-[#DDE5D9] shadow-xs space-y-4">
          <h3 className="font-display font-bold text-lg text-[#14201B] border-b border-[#DDE5D9] pb-3">
            Fulfillment & Delivery Settings
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase text-[#4E6057] block mb-1">
                Delivery Radius (km)
              </label>
              <input
                type="number"
                step="0.5"
                value={deliveryRadius}
                onChange={(e) => setDeliveryRadius(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F7F9F4] border border-[#BDCBB8] rounded-xl text-sm focus:outline-[#0E3B2C]"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase text-[#4E6057] block mb-1">
                Standard Delivery Time (Minutes)
              </label>
              <input
                type="number"
                value={deliveryTime}
                onChange={(e) => setDeliveryTime(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F7F9F4] border border-[#BDCBB8] rounded-xl text-sm focus:outline-[#0E3B2C]"
              />
            </div>
          </div>
        </div>

        {/* Edge CCTV Cameras & Smart Shelf Configuration */}
        <div className="bg-white rounded-2xl p-6 border border-[#DDE5D9] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#DDE5D9] pb-3">
            <h3 className="font-display font-bold text-lg text-[#14201B]">
              Edge Camera Ingestion & ML Pipeline
            </h3>
            <Badge variant="subtle" size="sm">TRL 3 Simulated Edge Mode</Badge>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 bg-[#F7F9F4] rounded-xl border border-[#DDE5D9] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Camera className="w-5 h-5 text-[#0E3B2C]" />
                <div>
                  <span className="font-bold text-[#14201B] block">Camera 1: Grains & Staples Rack</span>
                  <span className="text-[#4E6057]">RTSP stream: rtsp://edge-gateway.local:8554/cam1 (Simulated)</span>
                </div>
              </div>
              <Badge variant="grove" size="sm">Connected</Badge>
            </div>

            <div className="p-3.5 bg-[#F7F9F4] rounded-xl border border-[#DDE5D9] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Camera className="w-5 h-5 text-[#0E3B2C]" />
                <div>
                  <span className="font-bold text-[#14201B] block">Camera 2: Oils & Sweets Rack</span>
                  <span className="text-[#4E6057]">RTSP stream: rtsp://edge-gateway.local:8554/cam2 (Simulated)</span>
                </div>
              </div>
              <Badge variant="grove" size="sm">Connected</Badge>
            </div>
          </div>
        </div>

        {/* Academic Rigor & Privacy Notice */}
        <div className="bg-[#14201B] rounded-2xl p-6 text-white border border-[#2A3D34] space-y-3">
          <div className="flex items-center gap-2 text-[#FFB400] font-bold">
            <ShieldCheck className="w-5 h-5" />
            <span>Academic Rigor, Ethics & Prototype Classification</span>
          </div>

          <div className="text-xs text-white/80 space-y-2 leading-relaxed">
            <p>
              • <strong>TRL Classification:</strong> This project is strictly evaluated at <strong>Technology Readiness Level 3 (TRL 3)</strong> (Experimental proof of concept).
            </p>
            <p>
              • <strong>Privacy by Design:</strong> No facial recognition or biometric customer identifiers are stored or recorded. All ML camera processing occurs on simulated edge hardware, strictly extracting polygon counts and centroid coordinates.
            </p>
            <p>
              • <strong>Simulated Engine:</strong> Shelf gap detection, crowd levels, demand forecasts, and delivery dispatch operate through a deterministic seeded simulation layer (Seed: <code>localkart_pollachi_v2</code>) to guarantee consistent viva demonstrations.
            </p>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {isSaved && (
            <span className="text-xs font-bold text-[#1F6B4A] flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Settings updated successfully
            </span>
          )}
          <Button type="submit" variant="palm" size="md">
            <Save className="w-4 h-4 mr-1.5" />
            <span>Save Store Settings</span>
          </Button>
        </div>
      </form>
    </div>
  );
};
