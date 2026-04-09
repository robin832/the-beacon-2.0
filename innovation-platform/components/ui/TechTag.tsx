'use client';

interface TechTagProps {
  label: string;
  source?: string;
  context?: string;
  className?: string;
}

export default function TechTag({ label, source, context, className = '' }: TechTagProps) {
  const hasTooltip = source || context;
  const tooltipText = [context, source ? `[${source}]` : ''].filter(Boolean).join(' ');

  return (
    <span
      className={`inline-block bg-black text-white font-mono text-xs px-3 py-1 rounded ${hasTooltip ? 'cursor-help' : ''} ${className}`}
      title={hasTooltip ? tooltipText : undefined}
    >
      {label}
      {source && (
        <span className="ml-1 text-white/40 text-[10px]">[{source}]</span>
      )}
    </span>
  );
}
