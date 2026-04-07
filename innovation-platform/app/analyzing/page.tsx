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
        router.push(`/verticals/${analysisId}`);
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

    // Poll for status changes every 3 seconds
    const interval = setInterval(checkStatus, 3000);

    // Also try realtime subscription
    const channel = supabase
      .channel(`analysis-${analysisId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'innovation',
          table: 'analyses',
          filter: `id=eq.${analysisId}`,
        },
        (payload) => {
          const newStatus = payload.new?.analysis_status;
          if (newStatus) {
            setStatus(newStatus);
            if (newStatus === 'complete') {
              router.push(`/verticals/${analysisId}`);
            } else if (newStatus === 'error') {
              setError(true);
            }
          }
        }
      )
      .subscribe();

    // Timeout after 90 seconds
    const timeout = setTimeout(() => {
      setError(true);
    }, 90000);

    return () => {
      clearInterval(interval);
      channel.unsubscribe();
      clearTimeout(timeout);
    };
  }, [analysisId, router, checkStatus]);

  if (error) {
    return (
      <div className="min-h-screen bg-beacon-dark-teal flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-white mb-4">
            Analysis Taking Longer Than Expected
          </h2>
          <p className="text-white/60 mb-8">
            Our AI is working hard, but something may have gone wrong.
            Please try again.
          </p>
          <button
            onClick={() => router.push('/')}
            className="h-14 px-10 bg-beacon-orange hover:bg-beacon-orange-hover text-white uppercase tracking-widest font-medium rounded transition-all duration-300"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return <TerminalLoader analysisStatus={status} />;
}
