'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import TerminalLoader from '@/components/analyzing/TerminalLoader';
import { supabase } from '@/lib/supabase';

export default function AnalyzingPage() {
  const router = useRouter();
  const [status, setStatus] = useState<string | null>('pending');
  const [error, setError] = useState(false);

  const analysisId = typeof window !== 'undefined'
    ? sessionStorage.getItem('analysis_id')
    : null;

  const checkStatus = useCallback(async () => {
    if (!analysisId) return;
    const { data } = await supabase
      .from('analyses')
      .select('analysis_status')
      .eq('id', analysisId)
      .single();
    if (data) {
      setStatus(data.analysis_status);
      if (data.analysis_status === 'complete') {
        router.push(`/report/${analysisId}`);
      } else if (data.analysis_status === 'error') {
        setError(true);
      }
    }
  }, [analysisId, router]);

  useEffect(() => {
    if (!analysisId) {
      router.push('/');
      return;
    }

    // Poll every 4 seconds
    const interval = setInterval(checkStatus, 4000);

    // Timeout after 3 minutes (analysis can take a while with rate limit retries)
    const timeout = setTimeout(() => setError(true), 180000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [analysisId, router, checkStatus]);

  if (error) {
    const handleRetry = async () => {
      if (!analysisId) return;
      // Check one more time — maybe it completed while showing the error
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

  return <TerminalLoader analysisStatus={status} />;
}
