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
import { trackEvent } from '@/lib/tracking';
import { Analysis, EcosystemMatch } from '@/lib/types';
import TechTag from '@/components/ui/TechTag';

const facilityImages = [
  { src: '/facilities/building.jpg', alt: 'The Beacon building', label: 'The Beacon' },
  { src: '/facilities/coworking.jpg', alt: 'Coworking space', label: 'Coworking' },
  { src: '/facilities/boardroom.jpg', alt: 'Boardroom', label: 'Boardroom' },
  { src: '/facilities/terrace.jpeg', alt: 'Rooftop terrace', label: 'Terrace' },
];

export default function TryoutPage() {
  const params = useParams();
  const analysisId = params.analysisId as string;

  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [matches, setMatches] = useState<EcosystemMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

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
    return <PageTransition message="Unlocking your tryout" submessage="Preparing your exclusive Beacon experience..." />;
  }

  const visibleMatches = matches.filter((_, i) => i < 2);
  const lockedMatches = matches.filter((_, i) => i >= 2);

  return (
    <div className="relative min-h-screen bg-beacon-light-gray flex flex-col">
      <Header />

      {/* Image lightbox */}
      {expandedImage && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setExpandedImage(null)}
        >
          <button
            className="absolute top-6 right-6 text-white/60 hover:text-white text-3xl font-light"
            onClick={() => setExpandedImage(null)}
          >
            &times;
          </button>
          <img
            src={expandedImage}
            alt="Facility"
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
          />
        </div>
      )}

      <main className="flex-1 pt-28 pb-20">
        <div className="max-w-4xl mx-auto px-6 relative">
          <DecorativeBackground />

          <div style={{ animation: 'fadeInUp 0.6s ease-out' }}>
            <Badge variant="cyan" className="mb-6">Tryout Package Unlocked</Badge>

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
                          {match.match_score ? `${Math.round(Number(match.match_score) * 100)}%` : '—'}
                        </span>
                      </div>
                      {match.match_rationale && (
                        <p className="text-sm text-beacon-dark-teal/70 leading-relaxed mt-2">{match.match_rationale}</p>
                      )}
                      {match.collaboration_idea && (
                        <div className="mt-3 p-3 bg-beacon-light-gray rounded">
                          <span className="text-[10px] font-mono tracking-widest uppercase text-beacon-medium-gray">Collaboration idea</span>
                          <p className="text-sm text-beacon-dark-teal/70 leading-relaxed mt-1">{match.collaboration_idea}</p>
                        </div>
                      )}
                      {match.shared_themes && match.shared_themes.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {match.shared_themes.map((t, i) => <TechTag key={i} label={String(t)} />)}
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
              <Card className="overflow-hidden">
                {/* Clickable photo gallery */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-0.5">
                  {facilityImages.map((img) => (
                    <button
                      key={img.src}
                      className="aspect-[4/3] relative overflow-hidden group cursor-pointer"
                      onClick={() => setExpandedImage(img.src)}
                    >
                      <img src={img.src} alt={img.alt} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                      <span className="absolute bottom-2 left-2 text-[10px] font-mono tracking-widest uppercase text-white/0 group-hover:text-white/80 transition-colors duration-300 drop-shadow-lg">
                        {img.label}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="p-8">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-12 h-12 rounded-full bg-beacon-orange/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl">🏢</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-beacon-dark-teal">
                        A Day at The Beacon
                      </h3>
                      <p className="text-sm text-beacon-medium-gray mt-1">
                        Experience our innovation hub firsthand
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-beacon-dark-teal/70 leading-relaxed mb-6">
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

                  {/* YouTube video */}
                  <div className="aspect-video rounded-lg overflow-hidden border-2 border-beacon-border">
                    <iframe
                      src="https://www.youtube.com/embed/WhnBSJz6k9I"
                      title="The Beacon - Innovation Hub Antwerp"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full"
                    />
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

            {/* Book a Visit CTA — Calendly */}
            <div className="bg-beacon-dark-teal rounded-lg p-8 sm:p-12 text-center">
              <h3 className="text-2xl font-bold text-white mb-3">
                Ready to experience The Beacon?
              </h3>
              <p className="text-white/60 mb-8 max-w-lg mx-auto">
                Book a visit and we&apos;ll arrange your full tryout package —
                coworking day, meeting room, event access, and introductions
                to your matched companies.
              </p>
              <a
                href="https://calendly.com/robinpauwels/meeting-30"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackEvent('book_visit_click', '/tryout', { analysis_id: analysisId })}
                className="inline-flex items-center justify-center h-14 px-10 bg-beacon-orange hover:bg-beacon-orange-hover text-white uppercase tracking-widest font-medium rounded transition-all duration-300 text-sm"
              >
                Book Your Visit →
              </a>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
