'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
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
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

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

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (lightboxIndex === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxIndex(null);
      if (e.key === 'ArrowRight') setLightboxIndex((prev) => prev !== null ? (prev + 1) % facilityImages.length : null);
      if (e.key === 'ArrowLeft') setLightboxIndex((prev) => prev !== null ? (prev - 1 + facilityImages.length) % facilityImages.length : null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightboxIndex]);

  if (loading || !analysis) {
    return <PageTransition message="Unlocking your tryout" submessage="Preparing your exclusive Beacon experience..." />;
  }

  const visibleMatches = matches.slice(0, 2);
  const lockedMatches = matches.slice(2, 6);

  return (
    <div className="relative min-h-screen bg-beacon-light-gray flex flex-col">
      <Header />

      {/* Scrollable image lightbox */}
      {lightboxIndex !== null && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center" onClick={() => setLightboxIndex(null)}>
          <button className="absolute top-6 right-6 text-white/60 hover:text-white text-3xl z-20" onClick={() => setLightboxIndex(null)}>&times;</button>
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-4xl z-20 p-2"
            onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex - 1 + facilityImages.length) % facilityImages.length); }}
          >&#8249;</button>
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-4xl z-20 p-2"
            onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex + 1) % facilityImages.length); }}
          >&#8250;</button>
          <div onClick={(e) => e.stopPropagation()}>
            <img src={facilityImages[lightboxIndex].src} alt={facilityImages[lightboxIndex].alt} className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg" />
            <p className="text-center text-white/50 text-sm font-mono mt-3">{facilityImages[lightboxIndex].label} — {lightboxIndex + 1}/{facilityImages.length}</p>
          </div>
        </div>
      )}

      <main className="flex-1 pt-28 pb-20">
        <div className="max-w-5xl mx-auto px-6">
          <div style={{ animation: 'fadeInUp 0.6s ease-out' }}>
            <Badge variant="cyan" className="mb-6">Tryout Package Unlocked</Badge>

            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-beacon-dark-teal mb-4">
              Your Free Tryout at The Beacon
            </h1>
            <p className="text-beacon-medium-gray mb-12 max-w-2xl">
              Based on your innovation profile, we&apos;ve prepared three exclusive
              experiences for {analysis.company_name}.
            </p>

            {/* Tryout 1: Ecosystem Matches — 3-per-row cards */}
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-beacon-cyan/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">🤝</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-beacon-dark-teal">Your Ecosystem Matches</h2>
                  <p className="text-sm text-beacon-medium-gray">Companies at The Beacon that match your innovation profile</p>
                </div>
              </div>

              {/* 2 visible — larger */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                {visibleMatches.map((match) => (
                  <Card key={match.id} className="p-6 border-beacon-cyan/30" hover>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-xl font-bold text-beacon-dark-teal">{match.account_name || 'Beacon Member'}</h3>
                        {match.account_website && (
                          <a href={match.account_website.startsWith('http') ? match.account_website : `https://${match.account_website}`}
                            target="_blank" rel="noopener noreferrer"
                            className="text-xs text-beacon-cyan hover:underline font-mono"
                          >{match.account_website}</a>
                        )}
                      </div>
                      {match.match_category && <Badge variant="cyan">{match.match_category}</Badge>}
                    </div>
                    {match.match_rationale && (
                      <p className="text-sm text-beacon-dark-teal/70 leading-relaxed mb-3">{match.match_rationale}</p>
                    )}
                    {match.collaboration_idea && (
                      <div className="p-3 bg-beacon-light-gray rounded mb-3">
                        <span className="text-[10px] font-mono tracking-widest uppercase text-beacon-medium-gray">Collaboration idea</span>
                        <p className="text-sm text-beacon-dark-teal/70 leading-relaxed mt-1">{match.collaboration_idea}</p>
                      </div>
                    )}
                    {match.shared_themes && match.shared_themes.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {match.shared_themes.map((t, i) => <TechTag key={i} label={String(t)} />)}
                      </div>
                    )}
                    <div className="mt-3 text-right">
                      <span className="text-2xl font-black text-beacon-dark-teal">
                        {match.match_score ? `${Math.round(Number(match.match_score) * 100)}%` : '—'}
                      </span>
                      <span className="text-[10px] font-mono tracking-widest uppercase text-beacon-medium-gray ml-1">match</span>
                    </div>
                  </Card>
                ))}
              </div>

              {/* 4 locked — smaller, 3 per row (+ 1 on next) */}
              {lockedMatches.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {lockedMatches.map((match) => (
                    <div key={match.id} className="border-2 border-beacon-border rounded p-4 relative overflow-hidden bg-white">
                      <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-10 flex items-center justify-center">
                        <div className="text-center">
                          <svg className="w-5 h-5 text-beacon-dark-teal/30 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          <span className="text-[10px] font-mono tracking-widest uppercase text-beacon-dark-teal/40">Visit to unlock</span>
                        </div>
                      </div>
                      <div className="blur-sm select-none">
                        <h4 className="font-bold text-beacon-dark-teal text-sm">████████</h4>
                        {match.match_category && <Badge variant="cyan" className="mt-1 text-[8px]">{match.match_category}</Badge>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tryout 2: Day at The Beacon */}
            <div className="mb-12">
              <Card className="overflow-hidden">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-0.5">
                  {facilityImages.map((img, i) => (
                    <button key={img.src} className="aspect-[4/3] relative overflow-hidden group cursor-pointer" onClick={() => setLightboxIndex(i)}>
                      <img src={img.src} alt={img.alt} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                      <span className="absolute bottom-2 left-2 text-[10px] font-mono tracking-widest uppercase text-white/0 group-hover:text-white/80 transition-colors duration-300 drop-shadow-lg">{img.label}</span>
                    </button>
                  ))}
                </div>

                <div className="p-8">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-10 h-10 rounded-full bg-beacon-orange/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-xl">🏢</span>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-beacon-dark-teal">A Day at The Beacon</h2>
                      <p className="text-sm text-beacon-medium-gray mt-1">Experience our innovation hub firsthand</p>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-beacon-dark-teal/70 leading-relaxed mb-6">
                    {['Full-day access to our coworking space in the heart of Antwerp\'s innovation district',
                      'Private meeting room for your team (up to 8 people)',
                      'Guided tour of The Beacon and introduction to the community',
                      '1-on-1 innovation consultation based on your maturity report',
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="text-beacon-cyan">✓</span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>

                  <div className="aspect-video rounded-lg overflow-hidden border-2 border-beacon-border">
                    <iframe src="https://www.youtube.com/embed/WhnBSJz6k9I" title="The Beacon" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="w-full h-full" />
                  </div>
                </div>
              </Card>
            </div>

            {/* Tryout 3: Free Event Access */}
            <div className="mb-12">
              <Card className="p-8">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-beacon-dark-teal/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xl">🎤</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-beacon-dark-teal">Free Access to a Matching Event</h2>
                    <p className="text-sm text-beacon-medium-gray mt-1 mb-4">Join an event tailored to your innovation profile</p>
                    <p className="text-sm text-beacon-dark-teal/70 leading-relaxed">
                      Based on your profile in{' '}
                      <strong>{(analysis.confirmed_verticals || []).join(', ') || analysis.industry}</strong>,
                      we&apos;ll match you with an upcoming event at The Beacon that addresses
                      your innovation gaps and connects you with the right people.
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Book a Visit CTA */}
            <div className="bg-beacon-dark-teal rounded-lg p-8 sm:p-12">
              <div className="flex flex-col sm:flex-row items-center gap-8">
                {/* Robin's photo */}
                <div className="flex-shrink-0">
                  <img
                    src="/robin.jpg"
                    alt="Robin Pauwels"
                    className="w-28 h-28 rounded-full object-cover border-4 border-white/10"
                  />
                </div>

                <div className="text-center sm:text-left">
                  <h3 className="text-2xl font-bold text-white mb-1">
                    Ready to experience The Beacon?
                  </h3>
                  <p className="text-white/40 text-sm font-mono mb-4">
                    Robin Pauwels — Community Manager
                  </p>
                  <p className="text-white/60 mb-6 max-w-lg">
                    I&apos;d love to show you around. Book a visit and I&apos;ll personally
                    arrange your full tryout — coworking day, meeting room, introductions
                    to your matched companies, and event access.
                  </p>
                  <a
                    href="https://calendly.com/robinpauwels/meeting-30"
                    target="_blank" rel="noopener noreferrer"
                    onClick={() => trackEvent('book_visit_click', '/tryout', { analysis_id: analysisId })}
                    className="inline-flex items-center justify-center h-14 px-10 bg-beacon-orange hover:bg-beacon-orange-hover text-white uppercase tracking-widest font-medium rounded transition-all duration-300 text-sm"
                  >
                    Book a Visit with Robin →
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
