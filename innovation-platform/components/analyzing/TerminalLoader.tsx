'use client';

import { useEffect, useState } from 'react';

const statusMessages = [
  { text: 'Initializing innovation scanner...', delay: 0 },
  { text: 'Scanning public data sources...', delay: 3000 },
  { text: 'Searching for R&D activities and patents...', delay: 8000 },
  { text: 'Analyzing technology investments...', delay: 14000 },
  { text: 'Evaluating digital transformation maturity...', delay: 22000 },
  { text: 'Reviewing product and service innovation...', delay: 30000 },
  { text: 'Identifying strategic partnerships...', delay: 38000 },
  { text: 'Detecting innovation gaps and opportunities...', delay: 46000 },
  { text: 'Assessing market leadership position...', delay: 54000 },
  { text: 'Matching with Beacon ecosystem partners...', delay: 64000 },
  { text: 'Calculating innovation maturity scores...', delay: 74000 },
  { text: 'Generating your personalized report...', delay: 84000 },
  { text: 'Almost there — finalizing analysis...', delay: 100000 },
];

interface TerminalLoaderProps {
  analysisStatus: string | null;
}

export default function TerminalLoader({ analysisStatus }: TerminalLoaderProps) {
  const [visibleLines, setVisibleLines] = useState(0);
  const [startTime] = useState(Date.now());

  // Time-based progression — keeps moving regardless of backend status
  useEffect(() => {
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const nextVisible = statusMessages.filter((m) => elapsed >= m.delay).length;
      setVisibleLines(nextVisible);
    }, 500);

    return () => clearInterval(timer);
  }, [startTime]);

  // If analysis is complete, show all lines immediately
  useEffect(() => {
    if (analysisStatus === 'complete') {
      setVisibleLines(statusMessages.length);
    }
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

          <div className="space-y-3 font-mono text-sm">
            {statusMessages.map((msg, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 transition-all duration-700 ${
                  i < visibleLines
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-2'
                }`}
              >
                <span
                  className={`mt-0.5 flex-shrink-0 ${
                    i < visibleLines - 1 ? 'text-green-400' : 'text-beacon-cyan'
                  }`}
                >
                  {i < visibleLines - 1 ? '✓' : '▸'}
                </span>
                <span
                  className={
                    i < visibleLines - 1
                      ? 'text-white/50'
                      : 'text-white'
                  }
                >
                  {msg.text}
                </span>
              </div>
            ))}

            {/* Blinking cursor */}
            {visibleLines < statusMessages.length && visibleLines > 0 && (
              <span
                className="inline-block w-2 h-4 bg-beacon-cyan ml-6"
                style={{ animation: 'blink 1s step-end infinite' }}
              />
            )}
          </div>
        </div>

        <p className="text-center text-white/30 text-xs font-mono mt-8 tracking-wider">
          This typically takes 30–60 seconds
        </p>
      </div>
    </div>
  );
}
