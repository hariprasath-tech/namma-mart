import React from 'react';
import { X, MapPin, Navigation, Check } from 'lucide-react';
import { useLocationStore } from '../../store/location';
import { useLangStore } from '../../store/lang';
import townsData from '../../data/towns.json';
import { TownLocation } from '../../types';
import { Button } from '../ui/Button';

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LocationModal: React.FC<LocationModalProps> = ({ isOpen, onClose }) => {
  const { selectedTown, setTown, detectLocation, isDetecting } = useLocationStore();
  const { language } = useLangStore();

  if (!isOpen) return null;

  const handleSelect = (town: TownLocation) => {
    setTown(town);
    onClose();
  };

  const handleDetect = async () => {
    await detectLocation();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[#DDE5D9] overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="location-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#DDE5D9] bg-[#F7F9F4]">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[#0E3B2C]" />
            <h2 id="location-modal-title" className="font-display font-bold text-lg text-[#14201B]">
              {language === 'ta' ? 'நகரம் / பகுதியைத் தேர்வு செய்க' : 'Choose Your Town / Area'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-[#4E6057] hover:bg-[#EEF3EA] transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Detect Button */}
          <Button
            variant="outline"
            onClick={handleDetect}
            disabled={isDetecting}
            fullWidth
            className="flex items-center justify-center gap-2 border-[#1F6B4A] text-[#0E3B2C] hover:bg-[#EEF3EA]"
          >
            <Navigation className="w-4 h-4 text-[#1F6B4A]" />
            <span>
              {isDetecting
                ? (language === 'ta' ? 'கண்டறியப்படுகிறது...' : 'Detecting GPS...')
                : (language === 'ta' ? 'தற்போதைய இருப்பிடத்தைப் பயன்படுத்து' : 'Use Current GPS Location')}
            </span>
          </Button>

          <div className="relative flex py-1 items-center">
            <div className="grow border-t border-[#DDE5D9]"></div>
            <span className="shrink mx-3 text-xs text-[#4E6057] uppercase tracking-wider font-semibold">
              {language === 'ta' ? 'பொள்ளாச்சி & சுற்றியுள்ள பகுதிகள்' : 'Pollachi & Nearby Towns'}
            </span>
            <div className="grow border-t border-[#DDE5D9]"></div>
          </div>

          {/* Town List */}
          <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
            {townsData.map((town) => {
              const isSelected = selectedTown.id === town.id;
              return (
                <button
                  key={town.id}
                  onClick={() => handleSelect(town as TownLocation)}
                  className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'border-[#0E3B2C] bg-[#EEF3EA] text-[#0E3B2C] font-semibold'
                      : 'border-[#DDE5D9] hover:border-[#BDCBB8] hover:bg-[#F7F9F4] text-[#14201B]'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="text-base font-medium">
                      {language === 'ta' ? town.nameTa : town.name}
                    </span>
                    <span className="text-xs text-[#4E6057]">{town.area}</span>
                  </div>
                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-[#0E3B2C] text-white flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
