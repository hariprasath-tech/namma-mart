import React from 'react';
import clsx from 'clsx';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'palm' | 'grove' | 'marigold' | 'chilli' | 'subtle' | 'outline';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'subtle',
  size = 'md',
  className,
}) => {
  const base = 'inline-flex items-center font-medium rounded-full';
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  const variantClasses = {
    palm: 'bg-[#0E3B2C] text-white',
    grove: 'bg-[#1F6B4A] text-white',
    marigold: 'bg-[#FFB400] text-[#14201B] font-bold shadow-sm',
    chilli: 'bg-[#D63A2F]/10 text-[#D63A2F] border border-[#D63A2F]/20',
    subtle: 'bg-[#EEF3EA] text-[#0E3B2C] border border-[#DDE5D9]',
    outline: 'border border-[#BDCBB8] text-[#14201B]',
  };

  return (
    <span className={clsx(base, sizeClasses[size], variantClasses[variant], className)}>
      {children}
    </span>
  );
};
