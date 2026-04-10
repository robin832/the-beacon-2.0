'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import StarRating from '@/components/ui/StarRating';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { supabase } from '@/lib/supabase';
import { getSessionId } from '@/lib/session';
import { trackEvent } from '@/lib/tracking';
import { Analysis, InnovationOpportunity } from '@/lib/types';

interface RatingAndCTAProps {
  analysisId: string;
  analysis: Analysis;
}

type FeedbackState = 'idle' | 'submitting' | 'submitted';

export default function RatingAndCTA({ analysisId, analysis }: RatingAndCTAProps) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [feedbackState, setFeedbackState] = useState<FeedbackState>('idle');
  const [regenerating, setRegenerating] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const topOpportunity = (analysis.innovation_gaps?.[0] as InnovationOpportunity | undefined);
  const topOpportunityText =
    topOpportunity?.opportunity || topOpportunity?.gap || analysis.industry || 'innovation';

  const handleRate = (value: number) => {
    setRating(value);
    trackEvent('rating_selected', '/report', { rating: value });
  };

  const handleSubmitFeedback = async () => {
    if (rating === 0) {
      setErrorMsg('Please rate the analysis first.');
      return;
    }
    setErrorMsg(null);
    setFeedbackState('submitting');
    const sessionId = getSessionId();
    try {
      await supabase.functions.invoke('submit-lead', {
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
      trackEvent('feedback_submitted', '/report', { analysis_id: analysisId, rating });
      setFeedbackState('submitted');
    } catch (err) {
      console.error('Feedback submit failed:', err);
      setErrorMsg('Could not submit feedback. Please try again.');
      setFeedbackState('idle');
    }
  };

  const handleRegenerate = async () => {
    if (rating === 0 && !feedback.trim()) {
      setErrorMsg('Add a rating or feedback before regenerating.');
      return;
    }
    setErrorMsg(null);
    setRegenerating(true);
    const sessionId = getSessionId();

    try {
      // 1. Persist feedback on the current analysis (fire-and-forget)
      supabase.functions.invoke('submit-lead', {
        body: {
          analysis_id: analysisId,
          session_id: sessionId,
          company_name: analysis.company_name,
          lead_type: 'feedback',
          rating: rating || null,
          message: feedback || null,
          name: null,
          email: null,
        },
      });

      // 2. Create a new analysis row that traces back to this one
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
          user_rating: rating || null,
        })
        .select('id')
        .single();

      if (insertError || !newAnalysis) throw insertError || new Error('Insert returned no row');

      // 3. Fire the analysis with feedback_context so cache is skipped and the
      //    prompt incorporates the user's corrections
      supabase.functions.invoke('innovation-analysis', {
        body: {
          analysis_id: newAnalysis.id,
          company_name: analysis.company_name,
          company_website: analysis.company_website,
          industry: analysis.industry,
          confirmed_verticals: analysis.confirmed_verticals || [],
          session_id: sessionId,
          feedback_context: {
            rating: rating || null,
            feedback: feedback || '',
          },
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

  const handleClaimTryout = async () => {
    setClaiming(true);
    const sessionId = getSessionId();
    try {
      await supabase.functions.invoke('submit-lead', {
        body: {
          analysis_id: analysisId,
          session_id: sessionId,
          company_name: analysis.company_name,
          lead_type: 'tryout_claim',
          rating: rating || null,
          message: feedback || null,
          name: null,
          email: null,
        },
      });
      trackEvent('tryout_claimed', '/report', { analysis_id: analysisId, rating });
      router.push(`/tryout/${analysisId}`);
    } catch (err) {
      console.error('Tryout claim failed:', err);
      setClaiming(false);
    }
  };

  return (
    <section id="contact-section" className="bg-beacon-dark-teal py-20 px-6">
      <div className="max-w-2xl mx-auto space-y-8">
        <img src="/logo-white.svg" alt="The Beacon" className="h-6 mx-auto opacity-30" />

        {/* --- Step 1: Feedback card --- */}
        <Card className="p-8 bg-white/5 border-white/10 text-center">
          <p className="text-[10px] font-mono tracking-widest uppercase text-beacon-cyan mb-3">
            Help us improve this analysis
          </p>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-2">
            Rate the accuracy of this report
          </h2>
          <p className="text-white/40 text-sm mb-6">
            Your feedback helps our AI learn and produce better analyses.
          </p>

          <div className="flex justify-center mb-4">
            <StarRating value={rating} onChange={handleRate} />
          </div>
          {rating > 0 && (
            <p className="text-xs font-mono text-amber-400 mb-4">
              {rating}/5 &mdash; {['', 'Poor', 'Weak', 'Okay', 'Good', 'Excellent'][rating]}
            </p>
          )}

          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={3}
            placeholder="What did we get right? What did we miss? Any corrections?"
            className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white text-sm rounded focus:border-beacon-cyan focus:outline-none resize-none placeholder:text-white/20 mb-4"
          />

          {errorMsg && (
            <p className="text-xs text-red-400 mb-3">{errorMsg}</p>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleSubmitFeedback}
              disabled={feedbackState === 'submitting' || feedbackState === 'submitted' || regenerating}
              className="inline-flex items-center justify-center h-12 px-6 border-2 border-white/20 hover:border-white/40 text-white uppercase tracking-widest font-medium rounded transition-all duration-300 text-xs disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {feedbackState === 'submitting'
                ? 'Submitting…'
                : feedbackState === 'submitted'
                ? '\u2713 Feedback Sent'
                : 'Submit Feedback'}
            </button>
            <button
              onClick={handleRegenerate}
              disabled={regenerating || feedbackState === 'submitting'}
              className="inline-flex items-center justify-center h-12 px-6 bg-beacon-cyan/20 hover:bg-beacon-cyan/30 border-2 border-beacon-cyan text-beacon-cyan uppercase tracking-widest font-medium rounded transition-all duration-300 text-xs disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {regenerating ? 'Regenerating…' : 'Regenerate with Feedback \u2192'}
            </button>
          </div>

          <p className="text-[10px] font-mono text-white/30 mt-5 leading-relaxed">
            Regenerating will re-run the analysis incorporating your corrections.
            It takes about a minute.
          </p>
        </Card>

        {/* --- Step 2: Tryout CTA --- */}
        <div className="text-center">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-3">
            Unlock Your Free Tryout at The Beacon
          </h2>
          <p className="text-white/50 mb-6 max-w-xl mx-auto">
            Based on your opportunities in <strong className="text-white">{topOpportunityText}</strong>,
            we&apos;ve identified companies in our ecosystem and upcoming events that can help you act.
          </p>

          <div className="text-left max-w-md mx-auto mb-8 space-y-2">
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

          <Button
            variant="primary"
            size="large"
            onClick={handleClaimTryout}
            disabled={claiming || regenerating}
          >
            {claiming ? 'Redirecting…' : 'Claim Your Free Tryout \u2192'}
          </Button>
          <p className="text-[10px] font-mono tracking-widest uppercase text-white/30 mt-4">
            No rating required &mdash; feedback above is optional
          </p>
        </div>
      </div>
    </section>
  );
}
