import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Store, Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
      <div className="w-16 h-16 rounded-2xl bg-[#EEF3EA] text-[#0E3B2C] flex items-center justify-center mx-auto">
        <Store className="w-8 h-8" />
      </div>
      <h1 className="font-display font-bold text-3xl text-[#14201B]">
        Page Not Found (404)
      </h1>
      <p className="text-sm text-[#4E6057]">
        The shop or product screen you are looking for does not exist or has been moved.
      </p>
      <Link to="/" className="inline-block pt-2">
        <Button variant="palm" size="md">
          <Home className="w-4 h-4 mr-1.5" />
          <span>Back to Home</span>
        </Button>
      </Link>
    </div>
  );
};
