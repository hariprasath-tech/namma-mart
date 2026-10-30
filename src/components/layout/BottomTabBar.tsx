import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Search, GitCompare, Package, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';

export const BottomTabBar: React.FC = () => {
  const { t } = useTranslation();

  const tabs = [
    { to: '/', label: t('nav.home'), icon: Home },
    { to: '/search', label: t('nav.search'), icon: Search },
    { to: '/compare', label: t('nav.compare'), icon: GitCompare },
    { to: '/orders', label: t('nav.orders'), icon: Package },
    { to: '/account', label: t('nav.account'), icon: User },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#DDE5D9] shadow-lg pb-safe"
      aria-label="Bottom Navigation"
    >
      <div className="grid grid-cols-5 h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                clsx(
                  'flex flex-col items-center justify-center gap-1 select-none transition-colors min-h-[44px]',
                  isActive
                    ? 'text-[#0E3B2C] font-bold'
                    : 'text-[#4E6057] hover:text-[#0E3B2C]'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div
                    className={clsx(
                      'p-1 rounded-full transition-transform',
                      isActive ? 'bg-[#EEF3EA] scale-110' : ''
                    )}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] leading-none truncate max-w-[58px]">
                    {tab.label}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
