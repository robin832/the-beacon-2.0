'use client';

import { MaturityDimension } from '@/lib/types';

interface MaturityBreakdownProps {
  dimensions: MaturityDimension[];
}

export default function MaturityBreakdown({ dimensions }: MaturityBreakdownProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
      {dimensions.map((d) => (
        <div key={d.id} className="text-center">
          <div className="text-3xl sm:text-4xl font-black text-beacon-dark-teal">
            {d.score?.toFixed(1) || '—'}
          </div>
          <p className="mt-1 text-[10px] font-mono tracking-widest uppercase text-beacon-medium-gray leading-tight">
            {d.dimension_name}
          </p>
          {d.evidence && (
            <p className="mt-3 text-xs text-beacon-medium-gray leading-relaxed line-clamp-3">
              {d.evidence}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
