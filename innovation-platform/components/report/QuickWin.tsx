'use client';

import { QuickWin as QuickWinType } from '@/lib/types';
import Card from '@/components/ui/Card';

interface QuickWinProps {
  quickWin: QuickWinType | null;
}

export default function QuickWin({ quickWin }: QuickWinProps) {
  if (!quickWin) return null;

  return (
    <div className="mt-12">
      <h3 className="text-xs font-mono tracking-widest uppercase text-beacon-medium-gray mb-4">
        Your 30-Day Quick Win
      </h3>
      <Card className="p-6 sm:p-8 border-l-4 border-l-beacon-cyan">
        <h4 className="text-lg font-bold text-beacon-dark-teal mb-2">{quickWin.action}</h4>
        <p className="text-sm text-beacon-dark-teal/70 leading-relaxed mb-4">{quickWin.why}</p>
        <div className="p-4 bg-beacon-light-gray rounded">
          <span className="text-[10px] font-mono tracking-widest uppercase text-beacon-cyan font-bold">
            The Beacon Connection
          </span>
          <p className="text-sm text-beacon-dark-teal/70 leading-relaxed mt-1">{quickWin.beacon_connection}</p>
        </div>
      </Card>
    </div>
  );
}
