import React, { useState, useEffect } from 'react';
import {
  promptPwaInstall,
  subscribeToInstallable,
  subscribeToOnline,
  subscribeToUpdate,
  skipWaitingAndReload,
} from '../../lib/pwa';
import { Download, WifiOff, RefreshCw, X, Smartphone, Share } from 'lucide-react';

export const PwaBanner: React.FC = () => {
  const [canInstall, setCanInstall] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [hasUpdate, setHasUpdate] = useState(false);
  const [dismissedInstall, setDismissedInstall] = useState(false);
  const [showIosInstructions, setShowIosInstructions] = useState(false);

  // Check if iOS Safari
  const isIos =
    typeof navigator !== 'undefined' &&
    /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !(window as any).MSStream;
  const isStandalone =
    typeof window !== 'undefined' &&
    (window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone);

  useEffect(() => {
    const unsubInstall = subscribeToInstallable(setCanInstall);
    const unsubOnline = subscribeToOnline(setIsOnline);
    const unsubUpdate = subscribeToUpdate(() => setHasUpdate(true));

    return () => {
      unsubInstall();
      unsubOnline();
      unsubUpdate();
    };
  }, []);

  const handleInstallClick = async () => {
    if (canInstall) {
      const accepted = await promptPwaInstall();
      if (accepted) {
        setDismissedInstall(true);
      }
    } else if (isIos && !isStandalone) {
      setShowIosInstructions(true);
    }
  };

  return (
    <>
      {/* 1. Offline Mode Sticky Banner */}
      {!isOnline && (
        <div
          role="status"
          aria-live="polite"
          className="bg-[#D63A2F] text-white px-4 py-2.5 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-md sticky top-0 z-50 animate-in fade-in"
        >
          <WifiOff className="w-4 h-4 shrink-0" />
          <span>
            You are browsing offline. Cart and local store listings are cached, but live checkout requires network reconnection.
          </span>
        </div>
      )}

      {/* 2. New Version Available Banner */}
      {hasUpdate && (
        <div
          role="alert"
          className="bg-[#0E3B2C] text-white border-b border-[#FFB400] px-4 py-2.5 text-xs sm:text-sm font-semibold flex items-center justify-between shadow-lg sticky top-0 z-50"
        >
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-[#FFB400] animate-spin" />
            <span>A new version of LocalKart is ready!</span>
          </div>
          <button
            onClick={skipWaitingAndReload}
            className="bg-[#FFB400] text-[#14201B] hover:bg-[#E5A200] font-bold px-3 py-1 rounded-lg text-xs transition-colors shrink-0"
          >
            Update Now
          </button>
        </div>
      )}

      {/* 3. Install App Prompt (Android / Desktop Chrome / Edge) */}
      {canInstall && !dismissedInstall && !isStandalone && (
        <div className="fixed bottom-20 sm:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md bg-white border border-[#BDCBB8] rounded-2xl p-4 shadow-2xl z-40 flex items-center gap-3 animate-in slide-in-from-bottom-4">
          <div className="w-12 h-12 rounded-xl bg-[#0E3B2C] flex items-center justify-center text-[#FFB400] shrink-0 border border-[#1F6B4A]">
            <Smartphone className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-display font-bold text-sm text-[#14201B] leading-tight">
              Install LocalKart App
            </h4>
            <p className="text-xs text-[#4E6057] mt-0.5 truncate">
              Fast 1-tap local shopping in Pollachi & Tamil Nadu
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleInstallClick}
              className="bg-[#0E3B2C] hover:bg-[#1F6B4A] text-white font-bold text-xs px-3 py-2 rounded-xl flex items-center gap-1 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Install
            </button>
            <button
              onClick={() => setDismissedInstall(true)}
              className="p-1.5 text-[#88998F] hover:text-[#14201B] rounded-lg transition-colors"
              aria-label="Dismiss app install prompt"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 4. iOS Safari Add to Home Screen Instructions Modal */}
      {showIosInstructions && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-[#DDE5D9] text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#EEF3EA] text-[#0E3B2C] flex items-center justify-center mx-auto mb-4">
              <Share className="w-7 h-7" />
            </div>
            <h3 className="font-display font-bold text-lg text-[#14201B]">
              Install on iPhone / iPad
            </h3>
            <p className="text-xs text-[#4E6057] mt-2 leading-relaxed">
              To install LocalKart on your Apple home screen:
            </p>
            <ol className="text-left text-xs text-[#14201B] space-y-2 mt-4 bg-[#F7F9F4] p-4 rounded-xl border border-[#DDE5D9]">
              <li className="flex items-center gap-2">
                <span className="font-bold text-[#0E3B2C] w-5 h-5 rounded-full bg-white flex items-center justify-center border border-[#BDCBB8]">1</span>
                Tap the <strong>Share</strong> button at bottom of Safari
              </li>
              <li className="flex items-center gap-2">
                <span className="font-bold text-[#0E3B2C] w-5 h-5 rounded-full bg-white flex items-center justify-center border border-[#BDCBB8]">2</span>
                Scroll down and select <strong>"Add to Home Screen"</strong>
              </li>
              <li className="flex items-center gap-2">
                <span className="font-bold text-[#0E3B2C] w-5 h-5 rounded-full bg-white flex items-center justify-center border border-[#BDCBB8]">3</span>
                Tap <strong>"Add"</strong> in top right corner
              </li>
            </ol>
            <button
              onClick={() => setShowIosInstructions(false)}
              className="mt-5 w-full bg-[#0E3B2C] text-white font-bold py-2.5 rounded-xl text-sm"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
