import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, MessageCircle, LogIn, ShoppingBag } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const SplashPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    // 3.5 second auto-advance
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          navigate('/');
          return 100;
        }
        return prev + 3;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [navigate]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between p-6 sm:p-8 select-none overflow-hidden bg-[#0A1D16]">
      {/* Photorealistic Pollachi Coconut Landscape Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105 transition-transform duration-1000"
        style={{ backgroundImage: 'url("/localmart_bg.jpg")' }}
      />

      {/* Cinematic Vignette Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/35 to-black/80 pointer-events-none" />

      {/* Top Header Bar with Skip Pill Button */}
      <div className="w-full flex justify-end z-20">
        <button
          onClick={() => navigate('/')}
          className="px-4 py-1.5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 text-xs sm:text-sm font-semibold tracking-wide text-white flex items-center gap-1.5 transition-all shadow-lg active:scale-95 cursor-pointer"
        >
          <span>skip</span>
          <span className="text-base leading-none">→</span>
        </button>
      </div>

      {/* Central Hero Branding matching Image 4 */}
      <div className="flex flex-col items-center text-center space-y-5 my-auto z-20 max-w-md px-4">
        {/* 3D App Icon with Thick White Bezel & Glossy Finish */}
        <div className="relative group cursor-pointer" onClick={() => navigate('/login')}>
          <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-[28px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.6)] border-4 border-white/90 bg-[#0E3B2C] transform transition-transform duration-300 group-hover:scale-105">
            <img 
              src="/localmart_logo.jpg" 
              alt="LocalMart Logo" 
              className="w-full h-full object-cover scale-102"
            />
          </div>
        </div>

        {/* Brand Name - LocalMart */}
        <div className="space-y-3">
          <h1 className="font-display font-extrabold text-4xl sm:text-5xl md:text-6xl tracking-tight text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
            LocalMart
          </h1>

          {/* Golden Pill Badge */}
          <div className="inline-flex items-center justify-center px-4 py-1 rounded-full bg-[#142B21]/90 border border-[#FFB400]/70 shadow-md backdrop-blur-md">
            <span className="text-[11px] sm:text-xs font-bold tracking-[0.2em] text-[#FFB400] uppercase">
              LOCAL • SUSTAINABLE • TOGETHER
            </span>
          </div>

          {/* Calligraphic Tagline */}
          <p className="text-2xl sm:text-3xl text-[#FFB400] font-normal leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] font-['Satisfy',cursive] pt-1">
            Support Local. Shop Meaningful.
          </p>
        </div>

        {/* Action Button Links */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={() => navigate('/login')}
            className="px-5 py-2.5 rounded-full bg-[#FFB400] hover:bg-[#e6a200] text-[#14201B] font-extrabold text-xs sm:text-sm tracking-wide flex items-center gap-2 shadow-xl transition-all active:scale-95 cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In / Register</span>
          </button>
          <button
            onClick={() => navigate('/')}
            className="px-5 py-2.5 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-md text-white border border-white/30 font-semibold text-xs sm:text-sm tracking-wide flex items-center gap-2 shadow-xl transition-all active:scale-95 cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4 text-[#FFB400]" />
            <span>Explore Shops</span>
          </button>
        </div>
      </div>

      {/* Bottom Progress Bar & Affiliation Note */}
      <div className="w-full max-w-xs space-y-2.5 z-20 text-center">
        <div className="w-full bg-white/25 h-1.5 rounded-full overflow-hidden backdrop-blur-sm">
          <div
            className="bg-[#FFB400] h-full transition-all duration-100 ease-linear shadow-[0_0_8px_#FFB400]"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="text-[11px] text-white/70 font-medium tracking-wide">
          Sri Eshwar College of Engineering · CSE Innovation Project
        </p>
      </div>

      {/* Floating Chat Bubble Widget (matching bottom-right icon in Image 4) */}
      <div className="fixed bottom-6 right-6 z-30">
        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="w-13 h-13 rounded-full bg-gradient-to-tr from-[#1F6B4A] via-[#0E3B2C] to-[#FFB400] text-white flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all border border-white/25 cursor-pointer"
          title="Pollachi Assistant"
          aria-label="Assistant"
        >
          <MessageCircle className="w-6 h-6 text-white drop-shadow" />
        </button>

        {isChatOpen && (
          <div className="absolute bottom-16 right-0 w-72 bg-[#0E3B2C]/95 backdrop-blur-lg border border-white/20 rounded-2xl p-4 shadow-2xl text-white space-y-2 text-xs animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="font-bold text-[#FFB400]">LocalMart Assistant</span>
              <button 
                onClick={() => setIsChatOpen(false)}
                className="text-white/60 hover:text-white"
              >
                ✕
              </button>
            </div>
            <p className="text-white/80 leading-relaxed">
              Vanakkam! Looking for fresh farm produce, Sona Masoori, or Pollachi tender coconuts? Compare real-time prices now.
            </p>
            <button
              onClick={() => { setIsChatOpen(false); navigate('/search'); }}
              className="w-full py-2 bg-[#FFB400] text-[#14201B] font-bold rounded-lg text-center"
            >
              Search Pollachi Market
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
