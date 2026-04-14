'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import StarRating from '@/components/ui/StarRating';
import Button from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { getSessionId } from '@/lib/session';
import { trackEvent } from '@/lib/tracking';
import { Analysis, InnovationOpportunity } from '@/lib/types';

interface RatingAndCTAProps {
  analysisId: string;
  analysis: Analysis;
}

export default function RatingAndCTA({ analysisId, analysis }: RatingAndCTAProps) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [regenerating, setRegenerating] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const topOpportunity = (analysis.innovation_gaps?.[0] as InnovationOpportunity | undefined);
  const topOpportunityText =
    topOpportunity?.opportunity || topOpportunity?.gap || analysis.industry || 'innovation';

  const handleRate = (value: number) => {
    setRating(value);
    setErrorMsg(null);
    trackEvent('rating_selected', '/report', { rating: value });
  };

  const handleClaimTryout = async () => {
    if (rating === 0) {
      setErrorMsg('Please rate the report to unlock your tryout.');
      return;
    }
    setErrorMsg(null);
    setClaiming(true);
    const sessionId = getSessionId();
    try {
      await supabase.functions.invoke('submit-lead', {
        body: {
          analysis_id: analysisId,
          session_id: sessionId,
          company_name: analysis.company_name,
          lead_type: 'tryout_claim',
          rating,
          message: feedback || null,
          name: null,
          email: null,
        },
      });
      trackEvent('tryout_claimed', '/report', { analysis_id: analysisId, rating });
      router.push(`/tryout/${analysisId}`);
    } catch (err) {
      console.error('Tryout claim failed:', err);
      setErrorMsg('Could not submit. Please try again.');
      setClaiming(false);
    }
  };

  const handleRegenerate = async () => {
    if (rating === 0) {
      setErrorMsg('Please add a rating first — it helps us improve the regenerated report.');
      return;
    }
    setErrorMsg(null);
    setRegenerating(true);
    const sessionId = getSessionId();

    try {
      // Persist feedback on the current analysis (fire-and-forget)
      supabase.functions.invoke('submit-lead', {
        body: {
          analysis_id: analysisId,
          session_id: sessionId,
          company_name: analysis.company_name,
          lead_type: 'feedback',
          rating,
          message: feedback || null,
          name: null,
          email: null,
        },
      });

      const { data: newAnalysis, error: insertError } = await supabase
        .from('analyses')
        .insert({
          company_name: analysis.company_name,
          company_website: analysis.company_website,
          industry: analysis.industry,
          analysis_status: 'pending',
          session_id: sessionId,
          confirmed_verticals: analysis.confirmed_verticals || [],
          regenerated_from_id: analysisId,
          user_feedback: feedback || null,
          user_rating: rating,
        })
        .select('id')
        .single();

      if (insertError || !newAnalysis) throw insertError || new Error('Insert returned no row');

      supabase.functions.invoke('innovation-analysis', {
        body: {
          analysis_id: newAnalysis.id,
          company_name: analysis.company_name,
          company_website: analysis.company_website,
          industry: analysis.industry,
          confirmed_verticals: analysis.confirmed_verticals || [],
          session_id: sessionId,
          feedback_context: { rating, feedback: feedback || '' },
        },
      });

      trackEvent('analysis_regenerated', '/report', {
        original_analysis_id: analysisId,
        new_analysis_id: newAnalysis.id,
        rating,
      });

      sessionStorage.setItem('analysis_id', newAnalysis.id);
      router.push('/analyzing');
    } catch (err) {
      console.error('Regenerate failed:', err);
      setErrorMsg('Could not regenerate the analysis. Please try again.');
      setRegenerating(false);
    }
  };

  const ratingLabel = ['', 'Poor', 'Weak', 'Okay', 'Good', 'Excellent'][rating];
  const unlocked = rating > 0;

  return (
    <section id="contact-section" className="bg-beacon-dark-teal py-20 px-6">
      <div className="max-w-2xl mx-auto">
        <img src="/logo-white.png" alt="The Beacon" className="h-6 mx-auto opacity-30 mb-8" />

        {/* Step 1: CTA headline + benefits */}
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-3">
            Unlock Your Free Tryout at The Beacon
          </h2>
          <p className="text-white/50 mb-6 max-w-xl mx-auto">
            Based on your opportunities in <strong className="text-white">{topOpportunityText}</strong>,
            we&apos;ve identified companies in our ecosystem and upcoming events that can help you act.
          </p>

          <div className="text-left max-w-md mx-auto space-y-2">
            {[
              'Meet your matched companies face-to-face',
              "Full-day access to The Beacon's workspace",
              '1-on-1 innovation consultation with Robin',
              'Access to a matching event in your sector',
            ].map((item) => (
              <div key={item} className="flex items-start gap-2 text-white/70 text-sm">
                <span className="text-beacon-cyan mt-0.5">&#x2713;</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Step 2: Rating (required) */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-6 sm:p-8">
          <div className="text-center mb-5">
            <p className="text-[10px] font-mono tracking-widest uppercase text-beacon-cyan mb-2">
              Step 1 of 2 &mdash; Required
            </p>
            <h3 className="text-xl font-bold text-white mb-1">
              How accurate was this report?
            </h3>
            <p className="text-xs text-white/40">
              A quick rating unlocks your tryout and helps our AI improve.
            </p>
          </div>

          <div className="flex justify-center mb-2">
            <StarRating value={rating} onChange={handleRate} />
          </div>
          <p className={`text-xs font-mono text-center mb-6 transition-opacity ${rating > 0 ? 'text-amber-400 opacity-100' : 'opacity-0'}`}>
            {rating > 0 ? `${rating}/5 — ${ratingLabel}` : '—'}
          </p>

          {/* Step 3: Feedback (optional) */}
          <div className="mb-6">
            <p className="text-[10px] font-mono tracking-widest uppercase text-white/40 mb-2 text-center">
              Step 2 of 2 &mdash; Optional but heavily recommended
            </p>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={3}
              placeholder="What did we get right? What did we miss? Any corrections?"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white text-sm rounded focus:border-beacon-cyan focus:outline-none resize-none placeholder:text-white/20"
            />
            <p className="text-[10px] font-mono text-white/30 mt-2 text-center">
              Written feedback teaches our AI to produce sharper analyses.
            </p>
          </div>

          {errorMsg && (
            <p className="text-xs text-red-400 mb-3 text-center">{errorMsg}</p>
          )}

          {/* Primary CTA: gated on rating */}
          <div className="flex justify-center mb-4">
            <Button
              variant="primary"
              size="large"
              onClick={handleClaimTryout}
              disabled={!unlocked || claiming || regenerating}
              className={!unlocked ? 'opacity-50 cursor-not-allowed' : ''}
            >
              {!unlocked ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Rate to unlock
                </span>
              ) : claiming ? 'Redirecting…' : 'Claim Your Free Tryout \u2192'}
            </Button>
          </div>

          {/* Secondary: regenerate */}
          <div className="text-center">
            <button
              onClick={handleRegenerate}
              disabled={!unlocked || regenerating || claiming}
              className="text-[11px] font-mono tracking-widest uppercase text-white/50 hover:text-beacon-cyan transition-colors disabled:opacity-30 disabled:cursor-not-allowed underline-offset-4 hover:underline"
            >
              {regenerating ? 'Regenerating…' : 'Or regenerate this report with your feedback \u2192'}
            </button>
            <p className="text-[10px] font-mono text-white/30 mt-2">
              Re-runs the analysis incorporating your corrections (~1 minute).
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
