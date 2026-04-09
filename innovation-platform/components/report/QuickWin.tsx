'use client';

import { QuickWin as QuickWinType } from '@/lib/types';
import Card from '@/components/ui/Card';

interface QuickWinProps {
  quickWin: QuickWinType | null;
}

export default function QuickWin({ quickWin }: QuickWinProps) {
  if (!quickWin) return null;

  const beaconText = quickWin.beacon_link || quickWin.beacon_connection;

  return (
    <div className="mt-12">
      <h3 className="text-xl font-bold text-beacon-dark-teal mb-4 flex items-center gap-3">
        <span className="w-8 h-8 rounded-full bg-beacon-cyan/10 flex items-center justify-center text-beacon-cyan text-sm font-bold">!</span>
        Start This Quarter
      </h3>
      <Card className="p-6 sm:p-8 border-l-4 border-l-beacon-cyan">
        <h4 className="text-lg font-bold text-beacon-dark-teal mb-2">{quickWin.action}</h4>
        <p className="text-sm text-beacon-dark-teal/70 leading-relaxed mb-4">{quickWin.why}</p>
        {beaconText && (
          <div className="p-4 bg-beacon-light-gray rounded">
            <span className="text-[10px] font-mono tracking-widest uppercase text-beacon-cyan font-bold">
              The Beacon Connection
            </span>
            <p className="text-sm text-beacon-dark-teal/70 leading-relaxed mt-1">{beaconText}</p>
          </div>
        )}
      </Card>
    </div>
  );
}
