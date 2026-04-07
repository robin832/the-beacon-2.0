'use client';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'cyan' | 'black' | 'orange';
  className?: string;
}

const variants = {
  default: 'bg-beacon-dark-teal text-white',
  cyan: 'bg-beacon-cyan/10 text-beacon-cyan',
  black: 'bg-black text-white',
  orange: 'bg-beacon-orange/10 text-beacon-orange',
};

export default function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-4 py-1.5 text-xs font-mono tracking-widest uppercase ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
