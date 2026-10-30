import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const SplashPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // 2.5 second auto-advance
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          navigate('/');
          return 100;
        }
        return prev + 4;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [navigate]);

  return (
    <div className="fixed inset-0 z-50 bg-[#0E3B2C] text-white flex flex-col items-center justify-between p-8 select-none overflow-hidden">
      {/* Kolam / Palm leaf subtle background motif */}
      <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#FFFFFF_1px,transparent_1px)] [background-size:24px_24px]"></div>

      {/* Skip Button */}
      <div className="w-full flex justify-end z-10">
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-xs sm:text-sm font-semibold tracking-wide flex items-center gap-1.5 transition-colors"
        >
          <span>Skip</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Hero Animated Logo & Branding */}
      <div className="flex flex-col items-center text-center space-y-6 my-auto z-10 max-w-sm">
        {/* Cart Icon with rolling entrance */}
        <div className="relative">
          <div className="w-24 h-24 rounded-3xl bg-white/10 border-2 border-white/20 flex items-center justify-center text-[#FFB400] shadow-2xl animate-bounce">
            <ShoppingBag className="w-12 h-12" />
          </div>
          <span className="absolute -bottom-2 -right-2 px-2.5 py-0.5 rounded-full bg-[#FFB400] text-[#14201B] font-extrabold text-[11px] shadow-md uppercase tracking-wider">
            Pollachi
          </span>
        </div>

        <div className="space-y-2">
          <h1 className="font-display font-extrabold text-4xl sm:text-5xl tracking-tight text-white">
            LocalKart
          </h1>
          <p className="font-display text-lg sm:text-xl text-[#FFB400] font-medium leading-snug">
            "Support Local. Shop Meaningful."
          </p>
        </div>

        <p className="text-xs text-white/70 max-w-xs leading-relaxed font-body">
          Compare prices, distance, and ratings across your favorite Pollachi market shops in seconds.
        </p>
      </div>

      {/* Bottom Progress Bar & College Note */}
      <div className="w-full max-w-xs space-y-3 z-10">
        <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-[#FFB400] h-full transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        <p className="text-[11px] text-white/50 text-center">
          Sri Eshwar College of Engineering · CSE Innovation Project
        </p>
      </div>
    </div>
  );
};
