'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import TerminalLoader from '@/components/analyzing/TerminalLoader';
import IndustryBriefing from '@/components/analyzing/IndustryBriefing';
import { supabase } from '@/lib/supabase';

export default function AnalyzingPage() {
  const router = useRouter();
  const [status, setStatus] = useState<string | null>('pending');
  const [industry, setIndustry] = useState<string | null>(null);
  const [error, setError] = useState(false);

  const analysisId = typeof window !== 'undefined'
    ? sessionStorage.getItem('analysis_id')
    : null;

  const checkStatus = useCallback(async () => {
    if (!analysisId) return;
    const { data } = await supabase
      .from('analyses')
      .select('analysis_status, industry')
      .eq('id', analysisId)
      .single();
    if (data) {
      setStatus(data.analysis_status);
      if (data.industry && !industry) setIndustry(data.industry);
      if (data.analysis_status === 'complete') {
        router.push(`/report/${analysisId}`);
      } else if (data.analysis_status === 'error') {
        setError(true);
      }
    }
  }, [analysisId, industry, router]);

  useEffect(() => {
    if (!analysisId) {
      router.push('/');
      return;
    }

    // Initial fetch so we have the industry immediately for the briefing
    checkStatus();

    // Poll every 4 seconds
    const interval = setInterval(checkStatus, 4000);

    // Timeout after 3 minutes
    const timeout = setTimeout(() => setError(true), 180000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [analysisId, router, checkStatus]);

  if (error) {
    const handleRetry = async () => {
      if (!analysisId) return;
      const { data } = await supabase
        .from('analyses')
        .select('analysis_status')
        .eq('id', analysisId)
        .single();
      if (data?.analysis_status === 'complete') {
        router.push(`/report/${analysisId}`);
      } else {
        router.push('/');
      }
    };

    return (
      <div className="min-h-screen bg-beacon-dark-teal flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-white mb-4">
            Analysis Taking Longer Than Expected
          </h2>
          <p className="text-white/60 mb-8">
            Our AI is doing a thorough deep dive. This can sometimes take
            a bit longer due to the amount of research involved.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleRetry}
              className="h-14 px-10 bg-beacon-orange hover:bg-beacon-orange-hover text-white uppercase tracking-widest font-medium rounded transition-all duration-300 text-sm"
            >
              Check Again
            </button>
            <button
              onClick={() => router.push('/')}
              className="h-14 px-10 border-2 border-white/30 text-white uppercase tracking-widest font-medium rounded transition-all duration-300 hover:bg-white/10 text-sm"
            >
              Start Over
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-beacon-dark-teal">
      {/* CRT scanline overlay (full page) */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,172,217,0.03) 2px, rgba(0,172,217,0.03) 4px)',
        }}
      />

      {/* Split view: terminal loader on the left, industry briefing on the right */}
      <div className="relative z-20 min-h-screen grid grid-cols-1 lg:grid-cols-2 gap-0">
        <div className="flex items-center justify-center py-12 px-6 border-b lg:border-b-0 lg:border-r border-white/5">
          <TerminalLoader analysisStatus={status} embedded />
        </div>
        <div className="flex items-center justify-center py-12 px-6">
          <IndustryBriefing industry={industry} />
        </div>
      </div>
    </div>
  );
}
