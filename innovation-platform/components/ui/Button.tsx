'use client';

import { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'default' | 'large';
  children: React.ReactNode;
}

const variantClasses = {
  primary:
    'bg-beacon-orange hover:bg-beacon-orange-hover text-white',
  secondary:
    'bg-beacon-dark-teal hover:bg-beacon-dark-teal/90 text-white',
  outline:
    'border-2 border-beacon-dark-teal text-beacon-dark-teal hover:bg-beacon-dark-teal hover:text-white bg-transparent',
};

const sizeClasses = {
  default: 'h-12 px-8 text-sm',
  large: 'h-14 px-10 text-sm',
};

export default function Button({
  variant = 'primary',
  size = 'default',
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center uppercase tracking-widest font-medium rounded transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
