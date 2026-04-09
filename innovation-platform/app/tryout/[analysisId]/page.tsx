'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import PageTransition from '@/components/ui/PageTransition';
import ContactForm from '@/components/report/ContactForm';
import { supabase } from '@/lib/supabase';
import { trackEvent } from '@/lib/tracking';
import { Analysis, EcosystemMatch, MatchDetails } from '@/lib/types';

const CARD_MIN_HEIGHT = 'min-h-[420px]';

export default function TryoutPage() {
  const params = useParams();
  const analysisId = params.analysisId as string;

  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [matches, setMatches] = useState<EcosystemMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showContactForm, setShowContactForm] = useState(false);

  useEffect(() => {
    async function load() {
      const [analysisRes, matchesRes] = await Promise.all([
        supabase.from('analyses').select('*').eq('id', analysisId).single(),
        supabase.from('ecosystem_matches').select('*').eq('analysis_id', analysisId).order('match_rank', { ascending: true }),
      ]);
      if (analysisRes.data) setAnalysis(analysisRes.data as Analysis);
      if (matchesRes.data) setMatches(matchesRes.data as EcosystemMatch[]);
      setLoading(false);
    }
    load();
    trackEvent('page_view', '/tryout', { analysis_id: analysisId });
  }, [analysisId]);

  if (loading || !analysis) {
    return <PageTransition message="Preparing your introductions" submessage="Loading your ecosystem matches..." />;
  }

  const visibleMatches = matches.filter((m) => m.is_visible).slice(0, 2);
  const lockedMatches = matches.filter((m) => !m.is_visible).slice(0, 4);
  const totalMatches = visibleMatches.length + lockedMatches.length;

  return (
    <div className="relative min-h-screen bg-beacon-light-gray flex flex-col">
      <Header />

      <main className="flex-1 pt-28 pb-20">
        <div className="max-w-6xl mx-auto px-6">
          <div style={{ animation: 'fadeInUp 0.6s ease-out' }}>
            <Badge variant="cyan" className="mb-6">Ecosystem Introductions</Badge>

            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-beacon-dark-teal mb-4">
              Your Matches at The Beacon
            </h1>
            <p className="text-beacon-medium-gray mb-12 max-w-2xl">
              Based on {analysis.company_name}&apos;s innovation profile, we&apos;ve identified
              {totalMatches > 0 ? ` ${totalMatches}` : ''} companies in The Beacon ecosystem that
              can help you act on your opportunities.
            </p>

            {/* Visible match cards — full detail */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {visibleMatches.map((match) => (
                <VisibleMatchCard key={match.id} match={match} />
              ))}
            </div>

            {/* Locked match cards — 4 in a row */}
            {lockedMatches.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
                {lockedMatches.map((match) => (
                  <LockedMatchCard key={match.id} match={match} />
                ))}
              </div>
            )}

            {/* CTA Banner */}
            <div className="bg-beacon-dark-teal rounded-lg p-8 sm:p-12">
              {!showContactForm ? (
                <div className="flex flex-col sm:flex-row items-center gap-8">
                  <div className="flex-shrink-0">
                    <img
                      src="/robin.jpg"
                      alt="Robin Pauwels"
                      className="w-28 h-28 rounded-full object-cover border-4 border-white/10"
                    />
                  </div>
                  <div className="text-center sm:text-left">
                    <h3 className="text-2xl font-bold text-white mb-1">
                      Meet all {totalMatches > 0 ? totalMatches : ''} matching companies
                    </h3>
                    <p className="text-white/40 text-sm font-mono mb-4">
                      Robin Pauwels — Community Manager
                    </p>
                    <p className="text-white/60 mb-6 max-w-lg">
                      Visit The Beacon and I&apos;ll personally arrange introductions
                      to your matched companies, plus a full day of coworking, meeting
                      room access, and event invitations.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <a
                        href="https://calendly.com/robinpauwels/meeting-30"
                        target="_blank" rel="noopener noreferrer"
                        onClick={() => trackEvent('book_visit_click', '/tryout', { analysis_id: analysisId })}
                        className="inline-flex items-center justify-center h-14 px-10 bg-beacon-orange hover:bg-beacon-orange-hover text-white uppercase tracking-widest font-medium rounded transition-all duration-300 text-sm"
                      >
                        Book Your Visit &rarr;
                      </a>
                      <button
                        onClick={() => setShowContactForm(true)}
                        className="inline-flex items-center justify-center h-14 px-10 border-2 border-white/20 hover:border-white/40 text-white uppercase tracking-widest font-medium rounded transition-all duration-300 text-sm"
                      >
                        Send a Message
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="max-w-lg mx-auto">
                  <ContactForm analysisId={analysisId} companyName={analysis.company_name} rating={0} />
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function VisibleMatchCard({ match }: { match: EcosystemMatch }) {
  const details: MatchDetails = (match.match_details as MatchDetails) || {};
  const expertise = details.member_expertise || [];
  const conversationStarter = details.conversation_starter || null;

  return (
    <Card className={`p-6 border-beacon-cyan/30 flex flex-col ${CARD_MIN_HEIGHT}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-xl font-bold text-beacon-dark-teal">
          {match.account_name || 'Beacon Member'}
        </h3>
        {match.match_category && <Badge variant="cyan">{match.match_category}</Badge>}
      </div>

      {/* Why this match — most important content */}
      {match.match_rationale && (
        <div className="mb-4 flex-1">
          <h4 className="text-[10px] font-mono tracking-widest uppercase text-beacon-medium-gray mb-2">
            Why this match matters for you
          </h4>
          <p className="text-sm text-beacon-dark-teal/70 leading-relaxed">
            {match.match_rationale}
          </p>
        </div>
      )}

      {/* Member expertise */}
      {expertise.length > 0 && (
        <div className="mb-4">
          <h4 className="text-[10px] font-mono tracking-widest uppercase text-beacon-medium-gray mb-2">
            Their relevant expertise
          </h4>
          <ul className="space-y-1">
            {expertise.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-beacon-dark-teal/60">
                <span className="text-beacon-cyan mt-0.5">&bull;</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Conversation starter */}
      {conversationStarter && (
        <div className="p-3 bg-beacon-light-gray rounded mb-4">
          <span className="text-[10px] font-mono tracking-widest uppercase text-beacon-medium-gray">
            Start the conversation about
          </span>
          <p className="text-sm text-beacon-dark-teal/70 leading-relaxed mt-1">
            {conversationStarter}
          </p>
        </div>
      )}

      {/* Shared sectors */}
      {match.shared_themes && match.shared_themes.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-auto pt-3 border-t border-beacon-border">
          {match.shared_themes.map((t, i) => (
            <span key={i} className="text-[10px] font-mono tracking-widest uppercase bg-beacon-border/50 text-beacon-medium-gray px-2 py-0.5 rounded">
              {String(t)}
            </span>
          ))}
        </div>
      )}
    </Card>
  );
}

function LockedMatchCard({ match }: { match: EcosystemMatch }) {
  const details: MatchDetails = (match.match_details as MatchDetails) || {};
  const teaserText = details.teaser_text || null;

  return (
    <div className={`border-2 border-beacon-border rounded-lg relative overflow-hidden bg-white flex flex-col ${CARD_MIN_HEIGHT}`}>
      {/* Blurred content area */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6">
        {/* Category badge — visible */}
        {match.match_category && (
          <Badge variant="cyan" className="mb-4">{match.match_category}</Badge>
        )}

        {/* Lock icon */}
        <svg className="w-8 h-8 text-beacon-dark-teal/20 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>

        {/* Teaser text — readable */}
        {teaserText && (
          <p className="text-sm text-beacon-dark-teal/60 text-center leading-relaxed max-w-[200px]">
            {teaserText}
          </p>
        )}

        <span className="text-[10px] font-mono tracking-widest uppercase text-beacon-dark-teal/30 mt-4">
          Unlock by visiting The Beacon
        </span>
      </div>

      {/* Background blur content — decorative */}
      <div className="blur-md select-none p-6 opacity-30">
        <div className="h-4 w-2/3 bg-beacon-border rounded mb-3" />
        <div className="h-3 w-full bg-beacon-border/50 rounded mb-2" />
        <div className="h-3 w-full bg-beacon-border/50 rounded mb-2" />
        <div className="h-3 w-4/5 bg-beacon-border/50 rounded mb-4" />
        <div className="h-3 w-full bg-beacon-border/50 rounded mb-2" />
        <div className="h-3 w-3/4 bg-beacon-border/50 rounded mb-4" />
        <div className="h-3 w-full bg-beacon-border/50 rounded mb-2" />
        <div className="h-3 w-2/3 bg-beacon-border/50 rounded" />
      </div>
    </div>
  );
}
