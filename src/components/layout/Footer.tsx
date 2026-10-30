import React from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '../ui/Badge';
import { Info, Store } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const Footer: React.FC = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-white border-t border-[#DDE5D9] mt-12 mb-16 md:mb-0 text-[#4E6057] text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-[#DDE5D9] pb-6">
          <div className="flex items-center gap-3">
            <span className="font-display font-bold text-xl text-[#0E3B2C]">
              LocalKart
            </span>
            <Badge variant="subtle" size="sm" className="font-semibold text-[#0E3B2C]">
              {t('app.demoBadge')}
            </Badge>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs sm:text-sm">
            <Link to="/" className="hover:text-[#0E3B2C] transition-colors">
              {t('nav.home')}
            </Link>
            <Link to="/search" className="hover:text-[#0E3B2C] transition-colors">
              {t('nav.search')}
            </Link>
            <Link to="/compare" className="hover:text-[#0E3B2C] transition-colors">
              {t('nav.compare')}
            </Link>
            <Link to="/shop" className="hover:text-[#0E3B2C] font-semibold text-[#1F6B4A] flex items-center gap-1 transition-colors">
              <Store className="w-3.5 h-3.5" />
              {t('nav.shopPortal')}
            </Link>
            <Link to="/account" className="hover:text-[#0E3B2C] transition-colors">
              {t('nav.account')}
            </Link>
          </div>
        </div>

        {/* Academic / Honesty Disclosure */}
        <div className="pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-[#4E6057]">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-[#1F6B4A] shrink-0" />
            <p>
              {t('app.demoNotice')} · Sri Eshwar College of Engineering, CSE Batch 2025–2029.
            </p>
          </div>
          <p className="text-right shrink-0">
            Pollachi, Tamil Nadu
          </p>
        </div>
      </div>
    </footer>
  );
};
