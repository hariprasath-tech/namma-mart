import React from 'react';
import clsx from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'palm' | 'marigold' | 'grove' | 'outline' | 'ghost' | 'chilli';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'palm',
  size = 'md',
  fullWidth = false,
  className,
  disabled,
  ...props
}) => {
  const base =
    'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none select-none';

  const sizeClasses = {
    sm: 'text-sm px-3.5 py-1.5 min-h-[38px]',
    md: 'text-base px-4 py-2.5 min-h-[44px]',
    lg: 'text-lg px-6 py-3 min-h-[50px] font-semibold',
  };

  const variantClasses = {
    palm: 'bg-[#0E3B2C] text-white hover:bg-[#1F6B4A] focus-visible:outline-[#0E3B2C]',
    marigold: 'bg-[#FFB400] text-[#14201B] hover:bg-[#EAA500] font-bold shadow-sm focus-visible:outline-[#FFB400]',
    grove: 'bg-[#1F6B4A] text-white hover:bg-[#0E3B2C] focus-visible:outline-[#1F6B4A]',
    outline: 'border border-[#BDCBB8] text-[#14201B] bg-white hover:bg-[#EEF3EA] focus-visible:outline-[#0E3B2C]',
    ghost: 'text-[#14201B] hover:bg-[#EEF3EA] focus-visible:outline-[#0E3B2C]',
    chilli: 'bg-[#D63A2F] text-white hover:bg-[#BA2F26] focus-visible:outline-[#D63A2F]',
  };

  return (
    <button
      className={clsx(
        base,
        sizeClasses[size],
        variantClasses[variant],
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};
