'use client';

import { MaturityDimension } from '@/lib/types';
import Card from '@/components/ui/Card';

interface MaturityBreakdownProps {
  dimensions: MaturityDimension[];
}

export default function MaturityBreakdown({ dimensions }: MaturityBreakdownProps) {
  return (
    <div className="space-y-6">
      {dimensions.map((d) => (
        <Card key={d.id} className="p-6">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-bold text-beacon-dark-teal">{d.dimension_name}</h3>
              <span className="text-[10px] font-mono tracking-widest uppercase text-beacon-medium-gray">
                Weight: {((d.weight || 0) * 100).toFixed(0)}%
              </span>
            </div>
            <div className="text-right">
              <div className="text-3xl font-black text-beacon-dark-teal">
                {d.score?.toFixed(1) || '—'}
              </div>
              <span className="text-[10px] font-mono tracking-widest uppercase text-beacon-medium-gray">/ 5.0</span>
            </div>
          </div>

          {/* Score bar */}
          <div className="w-full h-2 bg-beacon-border rounded-full mb-4">
            <div
              className="h-2 bg-beacon-cyan rounded-full transition-all duration-500"
              style={{ width: `${((d.score || 0) / 5) * 100}%` }}
            />
          </div>

          {/* Evidence */}
          {d.evidence && (
            <p className="text-sm text-beacon-dark-teal/70 leading-relaxed mb-3">
              {d.evidence}
            </p>
          )}

          {/* Key findings */}
          {d.key_findings && d.key_findings.length > 0 && (
            <ul className="space-y-1 mb-3">
              {d.key_findings.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-beacon-dark-teal/60">
                  <span className="text-beacon-cyan mt-1">•</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          )}

          {/* Insight */}
          {d.sub_scores?.insight && (
            <p className="text-sm font-medium text-beacon-dark-teal/80 italic border-t border-beacon-border pt-3">
              {d.sub_scores.insight}
            </p>
          )}
        </Card>
      ))}
    </div>
  );
}
