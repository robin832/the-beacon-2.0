'use client';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export default function Card({ children, className = '', hover = false }: CardProps) {
  return (
    <div
      className={`border-2 border-beacon-border bg-white rounded ${hover ? 'transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:border-beacon-dark-teal' : ''} ${className}`}
    >
      {children}
    </div>
  );
}
