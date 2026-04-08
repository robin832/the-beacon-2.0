'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import DecorativeBackground from '@/components/layout/DecorativeBackground';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import PageTransition from '@/components/ui/PageTransition';
import { supabase } from '@/lib/supabase';
import { getSessionId } from '@/lib/session';
import { trackEvent } from '@/lib/tracking';
import { Analysis, EcosystemMatch } from '@/lib/types';
import TechTag from '@/components/ui/TechTag';

export default function TryoutPage() {
  const params = useParams();
  const analysisId = params.analysisId as string;

  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [matches, setMatches] = useState<EcosystemMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingForm, setBookingForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

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

  const handleBookVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) return;

    const sessionId = getSessionId();
    await supabase.functions.invoke('submit-lead', {
      body: {
        analysis_id: analysisId,
        session_id: sessionId,
        name: form.name,
        email: form.email,
        company_name: analysis?.company_name,
        phone: form.phone || null,
        message: form.message || null,
        lead_type: 'booking_request',
        rating: null,
      },
    });
    trackEvent('book_visit_click', '/tryout', { analysis_id: analysisId });
    setSubmitted(true);
  };

  if (loading || !analysis) {
    return <PageTransition message="Unlocking your tryout" submessage="Preparing your exclusive Beacon experience..." />;
  }

  const visibleMatches = matches.filter((_, i) => i < 2);
  const lockedMatches = matches.filter((_, i) => i >= 2);

  return (
    <div className="relative min-h-screen bg-beacon-light-gray flex flex-col">
      <Header />
      <main className="flex-1 pt-28 pb-20">
        <div className="max-w-4xl mx-auto px-6 relative">
          <DecorativeBackground />

          <div style={{ animation: 'fadeInUp 0.6s ease-out' }}>
            <Badge variant="cyan" className="mb-6">🎉 Tryout Package Unlocked</Badge>

            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-beacon-dark-teal mb-4">
              Your Free Tryout
              <br />at The Beacon
            </h1>
            <p className="text-beacon-medium-gray mb-12 max-w-2xl">
              Based on your innovation profile, we&apos;ve prepared three exclusive
              experiences for {analysis.company_name}. No commitment — just come
              see what The Beacon ecosystem can do for you.
            </p>

            {/* Tryout 1: Matched Companies */}
            <div className="mb-8">
              <Card className="p-8">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 rounded-full bg-beacon-cyan/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">🤝</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-beacon-dark-teal">
                      6 Ecosystem Matches
                    </h3>
                    <p className="text-sm text-beacon-medium-gray mt-1">
                      Companies in The Beacon that match your innovation profile
                    </p>
                  </div>
                </div>

                {/* 2 visible matches */}
                <div className="space-y-4 mb-4">
                  {visibleMatches.map((match) => (
                    <div key={match.id} className="border-2 border-beacon-border rounded p-5">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-bold text-beacon-dark-teal">
                            {match.account_name || 'Beacon Member'}
                          </h4>
                          {match.match_category && (
                            <Badge variant="cyan" className="mt-1">{match.match_category}</Badge>
                          )}
                        </div>
                        <span className="text-2xl font-black text-beacon-dark-teal">
                          {match.match_score ? `${Math.round(match.match_score * 100)}%` : '—'}
                        </span>
                      </div>
                      {match.match_rationale && (
                        <p className="text-sm text-beacon-dark-teal/70 leading-relaxed mt-2">{match.match_rationale}</p>
                      )}
                      {match.shared_themes.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {match.shared_themes.map((t, i) => <TechTag key={i} label={t} />)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* 4 locked matches */}
                <div className="grid grid-cols-2 gap-3">
                  {lockedMatches.map((match) => (
                    <div key={match.id} className="border-2 border-beacon-border rounded p-4 relative overflow-hidden">
                      <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-10 flex items-center justify-center">
                        <div className="text-center">
                          <svg className="w-6 h-6 text-beacon-dark-teal/30 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          <span className="text-[10px] font-mono tracking-widest uppercase text-beacon-dark-teal/40">
                            Visit to unlock
                          </span>
                        </div>
                      </div>
                      <div className="blur-sm select-none">
                        <h4 className="font-bold text-beacon-dark-teal">████████</h4>
                        {match.match_category && <Badge variant="cyan" className="mt-1">{match.match_category}</Badge>}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Tryout 2: Day at The Beacon */}
            <div className="mb-8">
              <Card className="p-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-beacon-orange/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">🏢</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-beacon-dark-teal">
                      A Day at The Beacon
                    </h3>
                    <p className="text-sm text-beacon-medium-gray mt-1 mb-4">
                      Experience our innovation hub firsthand
                    </p>
                    <div className="space-y-2 text-sm text-beacon-dark-teal/70 leading-relaxed">
                      <div className="flex items-start gap-2">
                        <span className="text-beacon-cyan">✓</span>
                        <span>Full-day access to our coworking space in the heart of Antwerp&apos;s innovation district</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-beacon-cyan">✓</span>
                        <span>Private meeting room for your team (up to 8 people)</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-beacon-cyan">✓</span>
                        <span>Guided tour of The Beacon and introduction to the community</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-beacon-cyan">✓</span>
                        <span>1-on-1 innovation consultation based on your maturity report</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Tryout 3: Free Event Access */}
            <div className="mb-12">
              <Card className="p-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-beacon-dark-teal/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">🎤</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-beacon-dark-teal">
                      Free Access to a Matching Event
                    </h3>
                    <p className="text-sm text-beacon-medium-gray mt-1 mb-4">
                      Join an event tailored to your innovation profile
                    </p>
                    <p className="text-sm text-beacon-dark-teal/70 leading-relaxed">
                      Based on your profile in{' '}
                      <strong>{(analysis.confirmed_verticals || []).join(', ') || analysis.industry}</strong>,
                      we&apos;ll match you with an upcoming event at The Beacon that addresses
                      your innovation gaps and connects you with the right people in the ecosystem.
                      Whether it&apos;s a tech talk, industry meetup, or innovation workshop —
                      you&apos;ll leave with new insights and connections.
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Book a Visit CTA */}
            <div className="bg-beacon-dark-teal rounded-lg p-8 sm:p-12">
              {!bookingForm && !submitted && (
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-white mb-3">
                    Ready to experience The Beacon?
                  </h3>
                  <p className="text-white/60 mb-8 max-w-lg mx-auto">
                    Book a visit and we&apos;ll arrange your full tryout package —
                    coworking day, meeting room, event access, and introductions
                    to your matched companies.
                  </p>
                  <Button variant="primary" size="large" onClick={() => setBookingForm(true)}>
                    Book Your Visit →
                  </Button>
                </div>
              )}

              {bookingForm && !submitted && (
                <form onSubmit={handleBookVisit} className="max-w-md mx-auto">
                  <h3 className="text-xl font-bold text-white mb-6 text-center">
                    Book Your Visit
                  </h3>
                  <div className="space-y-4">
                    <input
                      type="text"
                      required
                      placeholder="Your name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full h-12 px-4 border-2 border-white/20 bg-white/10 text-white font-mono rounded focus:border-beacon-cyan focus:outline-none placeholder:text-white/30"
                    />
                    <input
                      type="email"
                      required
                      placeholder="Email address"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full h-12 px-4 border-2 border-white/20 bg-white/10 text-white font-mono rounded focus:border-beacon-cyan focus:outline-none placeholder:text-white/30"
                    />
                    <input
                      type="tel"
                      placeholder="Phone (optional)"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full h-12 px-4 border-2 border-white/20 bg-white/10 text-white font-mono rounded focus:border-beacon-cyan focus:outline-none placeholder:text-white/30"
                    />
                    <textarea
                      placeholder="Any preferences for your visit? (optional)"
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 border-2 border-white/20 bg-white/10 text-white font-mono text-sm rounded focus:border-beacon-cyan focus:outline-none resize-none placeholder:text-white/30"
                    />
                    <Button type="submit" variant="primary" size="large" className="w-full">
                      Confirm Visit →
                    </Button>
                  </div>
                </form>
              )}

              {submitted && (
                <div className="text-center">
                  <div className="text-5xl mb-4">✓</div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    We&apos;ll be in touch!
                  </h3>
                  <p className="text-white/60">
                    A member of our team will reach out within 24 hours
                    to schedule your visit and arrange your full tryout package.
                  </p>
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
