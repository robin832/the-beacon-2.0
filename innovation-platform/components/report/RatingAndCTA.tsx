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
  const [submitted, setSubmitted] = useState(false);

  const handleRate = (value: number) => {
    setRating(value);
    trackEvent('rating_submitted', '/report', { rating: value });
  };

  const handleClaimTryout = async () => {
    // Save the rating as a lead
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
    setSubmitted(true);
    trackEvent('tryout_claimed', '/report', { analysis_id: analysisId, rating });
    router.push(`/tryout/${analysisId}`);
  };

  return (
    <section id="contact-section" className="bg-beacon-light-gray py-20 px-6">
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-beacon-dark-teal mb-6">
          How valuable was this analysis?
        </h2>
        <p className="text-beacon-medium-gray mb-8">
          Rate this report to unlock your free tryout package at The Beacon.
        </p>

        <StarRating value={rating} onChange={handleRate} />

        {/* Notes field — appears after rating */}
        {rating > 0 && (
          <div className="mt-8" style={{ animation: 'fadeInUp 0.4s ease-out' }}>
            <Card className="p-6 text-left mb-6">
              <label className="block text-xs font-mono tracking-widest uppercase text-beacon-medium-gray mb-2">
                Any additional feedback? (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Tell us what you found most interesting, or what you'd like to learn more about..."
                className="w-full px-4 py-3 border-2 border-beacon-border font-mono text-sm bg-white rounded focus:border-beacon-cyan focus:ring-1 focus:ring-beacon-cyan focus:outline-none transition-colors text-beacon-dark-teal resize-none placeholder:text-beacon-medium-gray/50"
              />
            </Card>

            <Button
              variant="primary"
              size="large"
              onClick={handleClaimTryout}
              disabled={submitted}
              className="w-full sm:w-auto"
            >
              {submitted ? 'Redirecting...' : 'Claim Your Free Tryout →'}
            </Button>
          </div>
        )}

        {/* Locked state indicator */}
        {rating === 0 && (
          <div className="mt-8 flex items-center justify-center gap-2 text-beacon-medium-gray">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span className="text-sm">Rate this report to unlock your free tryout package</span>
          </div>
        )}
      </div>
    </section>
  );
}
