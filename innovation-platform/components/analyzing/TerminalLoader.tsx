'use client';

import { useEffect, useState } from 'react';

const statusMessages = [
  'Scanning public data sources...',
  'Analyzing R&D and technology investments...',
  'Evaluating digital transformation maturity...',
  'Identifying innovation gaps and opportunities...',
  'Matching with Beacon ecosystem partners...',
  'Generating your innovation report...',
];

interface TerminalLoaderProps {
  analysisStatus: string | null;
}

export default function TerminalLoader({ analysisStatus }: TerminalLoaderProps) {
  const [visibleLines, setVisibleLines] = useState(0);

  useEffect(() => {
    // Map analysis status to progress
    const statusMap: Record<string, number> = {
      pending: 1,
      researching: 2,
      analyzing: 4,
      matching: 5,
      complete: 6,
    };

    const target = statusMap[analysisStatus || 'pending'] || 1;

    // Progressively reveal lines
    const timer = setInterval(() => {
      setVisibleLines((prev) => {
        if (prev >= target) {
          clearInterval(timer);
          return prev;
        }
        return prev + 1;
      });
    }, 2500);

    return () => clearInterval(timer);
  }, [analysisStatus]);

  return (
    <div className="relative min-h-screen bg-beacon-dark-teal flex items-center justify-center overflow-hidden">
      {/* CRT scanline overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,172,217,0.03) 2px, rgba(0,172,217,0.03) 4px)',
          animation: 'scanline 8s linear infinite',
        }}
      />

      {/* Pulsing glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(0,172,217,0.08) 0%, transparent 70%)',
          animation: 'beaconGlow 4s ease-in-out infinite',
        }}
      />

      <div
        className="relative z-20 max-w-xl w-full px-6"
        style={{ animation: 'beaconFloat 4s ease-in-out infinite' }}
      >
        {/* Logo */}
        <div className="text-center mb-12">
          <span className="text-white/20 font-black text-2xl tracking-tight">
            THE BEACON
          </span>
        </div>

        {/* Terminal window */}
        <div className="bg-black/40 rounded-lg border border-white/10 p-8">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-3 h-3 rounded-full bg-red-500/60" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
            <div className="w-3 h-3 rounded-full bg-green-500/60" />
          </div>

          <div className="space-y-4 font-mono text-sm">
            {statusMessages.map((msg, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 transition-opacity duration-500 ${
                  i < visibleLines ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <span className={`mt-0.5 ${i < visibleLines - 1 ? 'text-green-400' : 'text-beacon-cyan'}`}>
                  {i < visibleLines - 1 ? '✓' : '▸'}
                </span>
                <span className={i < visibleLines - 1 ? 'text-white/60' : 'text-white'}>
                  {msg}
                </span>
              </div>
            ))}

            {/* Blinking cursor */}
            {visibleLines < statusMessages.length && (
              <span
                className="inline-block w-2 h-4 bg-beacon-cyan ml-6"
                style={{ animation: 'blink 1s step-end infinite' }}
              />
            )}
          </div>
        </div>

        <p className="text-center text-white/30 text-xs font-mono mt-8 tracking-wider">
          This typically takes 15–30 seconds
        </p>
      </div>
    </div>
  );
}
