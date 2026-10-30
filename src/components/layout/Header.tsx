import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, ShoppingBag, Store, Globe, ChevronDown, Eye } from 'lucide-react';
import { useLocationStore } from '../../store/location';
import { useCartStore } from '../../store/cart';
import { useLangStore } from '../../store/lang';
import { useAuthStore } from '../../store/auth';
import { useSimpleModeStore } from '../../store/simpleMode';
import { useTranslation } from 'react-i18next';

interface HeaderProps {
  onOpenLocationModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenLocationModal }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { selectedTown } = useLocationStore();
  const { getItemCount } = useCartStore();
  const { language, toggleLanguage } = useLangStore();
  const { user } = useAuthStore();
  const { isSimpleMode, toggleSimpleMode } = useSimpleModeStore();

  const cartCount = getItemCount();

  return (
    <header className="sticky top-0 z-40 bg-[#0E3B2C] text-white shadow-md border-b border-[#1F6B4A]/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Logo & Town Selector */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-[#FFB400] group-hover:bg-white/15 transition-all">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-bold text-xl sm:text-2xl tracking-tight text-white leading-none">
                LocalKart
              </span>
              <span className="text-[11px] text-[#FFB400] hidden sm:inline-block leading-tight font-medium">
                {t('app.tagline')}
              </span>
            </div>
          </Link>

          {/* Location Picker Pill */}
          <button
            onClick={onOpenLocationModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-xs sm:text-sm font-medium text-white transition-all min-h-[38px] max-w-[170px] sm:max-w-xs truncate"
            title="Change Town or Area"
          >
            <MapPin className="w-3.5 h-3.5 text-[#FFB400] shrink-0" />
            <span className="truncate">
              {language === 'ta' ? selectedTown.nameTa : selectedTown.name}
            </span>
            <ChevronDown className="w-3 h-3 opacity-70 shrink-0" />
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Simple Mode Toggle for Elderly Users */}
          <button
            onClick={toggleSimpleMode}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-xs sm:text-sm font-bold transition-all min-h-[38px] ${
              isSimpleMode
                ? 'bg-[#FFB400] text-[#14201B] border-[#FFB400] shadow-sm'
                : 'bg-white/10 hover:bg-white/15 border-white/15 text-white/90'
            }`}
            title="Toggle Simple / Elderly Friendly Mode"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {isSimpleMode ? 'Simple Mode ON' : 'Simple Mode'}
            </span>
          </button>

          {/* Language Switcher */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-xs sm:text-sm font-medium transition-all min-h-[38px]"
            title="Switch Language"
          >
            <Globe className="w-3.5 h-3.5 text-white/80" />
            <span className="font-bold text-[#FFB400]">
              {language === 'en' ? 'தமிழ்' : 'English'}
            </span>
          </button>

          {/* Shop Owner Portal Switch */}
          <Link
            to="/shop"
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1F6B4A] hover:bg-[#28845c] text-xs sm:text-sm font-medium text-white border border-white/15 transition-all min-h-[38px]"
          >
            <Store className="w-3.5 h-3.5 text-[#FFB400]" />
            <span>{t('nav.shopPortal')}</span>
          </Link>

          {/* Cart Button */}
          <Link
            to="/cart"
            className="relative flex items-center justify-center w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all"
            aria-label="View Cart"
          >
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[20px] h-[20px] px-1 rounded-full bg-[#FFB400] text-[#14201B] font-extrabold text-[11px] flex items-center justify-center border-2 border-[#0E3B2C] shadow-sm animate-pulse">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
};
