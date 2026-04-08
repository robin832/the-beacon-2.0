'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import StarRating from '@/components/ui/StarRating';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { supabase } from '@/lib/supabase';
import { getSessionId } from '@/lib/session';
import { trackEvent } from '@/lib/tracking';

interface RatingAndCTAProps {
  analysisId: string;
  companyName: string;
}

export default function RatingAndCTA({ analysisId, companyName }: RatingAndCTAProps) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleRate = (value: number) => {
    setRating(value);
    trackEvent('rating_submitted', '/report', { rating: value });
  };

  const handleClaimTryout = async () => {
    setSubmitting(true);
    const sessionId = getSessionId();
    await supabase.functions.invoke('submit-lead', {
      body: {
        analysis_id: analysisId,
        session_id: sessionId,
        company_name: companyName,
        lead_type: 'tryout_claim',
        rating,
        message: notes || null,
        name: null,
        email: null,
      },
    });
    trackEvent('tryout_claimed', '/report', { analysis_id: analysisId, rating });
    router.push(`/tryout/${analysisId}`);
  };

  return (
    <section id="contact-section" className="bg-beacon-dark-teal py-20 px-6">
      <div className="max-w-2xl mx-auto text-center">
        <img src="/logo-white.svg" alt="The Beacon" className="h-6 mx-auto mb-8 opacity-30" />

        <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-3">
          Unlock Your Free Tryout Package
        </h2>
        <p className="text-white/50 mb-8">
          Rate this report to claim your free day at The Beacon — including
          coworking, a meeting room, ecosystem introductions, and event access.
        </p>

        {/* Stars — always centered */}
        <div className="flex justify-center mb-6">
          <StarRating value={rating} onChange={handleRate} />
        </div>

        {/* Notes — appears after rating, optional */}
        {rating > 0 && (
          <div className="mt-6 mb-6" style={{ animation: 'fadeInUp 0.4s ease-out' }}>
            <Card className="p-5 text-left bg-white/5 border-white/10">
              <label className="block text-xs font-mono tracking-widest uppercase text-white/40 mb-2">
                Additional feedback (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Anything you'd like us to know..."
                className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white text-sm rounded focus:border-beacon-cyan focus:outline-none resize-none placeholder:text-white/20 font-mono"
              />
            </Card>
          </div>
        )}

        {/* Unlock button — always visible, blurred when no rating */}
        <div className="relative inline-block">
          {rating === 0 && (
            <div className="absolute inset-0 z-10 flex items-center justify-center">
              <div className="flex items-center gap-2 text-white/60 bg-beacon-dark-teal/80 px-4 py-2 rounded">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span className="text-sm font-medium">Rate to unlock</span>
              </div>
            </div>
          )}
          <Button
            variant="primary"
            size="large"
            onClick={handleClaimTryout}
            disabled={rating === 0 || submitting}
            className={rating === 0 ? 'blur-[2px] pointer-events-none' : ''}
          >
            {submitting ? 'Redirecting...' : 'Claim Your Free Tryout →'}
          </Button>
        </div>
      </div>
    </section>
  );
}
