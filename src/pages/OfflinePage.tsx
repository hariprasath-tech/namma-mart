import React from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const OfflinePage: React.FC = () => {
  return (
    <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
      <div className="w-16 h-16 rounded-2xl bg-[#D63A2F]/10 text-[#D63A2F] flex items-center justify-center mx-auto">
        <WifiOff className="w-8 h-8" />
      </div>
      <h1 className="font-display font-bold text-2xl text-[#14201B]">
        You are currently offline
      </h1>
      <p className="text-sm text-[#4E6057] leading-relaxed">
        LocalKart works best with an active connection. Your cached shop data will automatically sync as soon as you are reconnected to the internet.
      </p>
      <Button
        variant="palm"
        size="md"
        onClick={() => window.location.reload()}
        className="mt-2"
      >
        <RefreshCw className="w-4 h-4 mr-1.5" />
        <span>Retry Connection</span>
      </Button>
    </div>
  );
};
