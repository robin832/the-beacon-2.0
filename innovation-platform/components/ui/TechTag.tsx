'use client';

interface TechTagProps {
  label: string;
  className?: string;
}

export default function TechTag({ label, className = '' }: TechTagProps) {
  return (
    <span className={`inline-block bg-black text-white font-mono text-xs px-3 py-1 rounded ${className}`}>
      {label}
    </span>
  );
}
