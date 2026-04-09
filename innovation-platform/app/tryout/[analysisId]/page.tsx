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
  const [showContactForm, setShowContactForm] = useState(false);
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
    return <PageTransition message="Preparing your introductions" submessage="Loading your ecosystem matches..." />;
  }

  const visibleMatches = matches.filter((m) => m.is_visible).slice(0, 2);
  const lockedMatches = matches.filter((m) => !m.is_visible).slice(0, 4);

  return (
    <div className="relative min-h-screen bg-beacon-light-gray flex flex-col">
      <Header />

      {/* Lightbox */}
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
        <div className="max-w-6xl mx-auto px-6">
          <div style={{ animation: 'fadeInUp 0.6s ease-out' }}>
            <Badge variant="cyan" className="mb-6">Tryout Package Unlocked</Badge>

            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-beacon-dark-teal mb-4">
              Your Free Tryout at The Beacon
            </h1>
            <p className="text-beacon-medium-gray mb-12 max-w-2xl">
              Based on your innovation profile, we&apos;ve prepared three exclusive
              experiences for {analysis.company_name}.
            </p>

            {/* Tryout 1: Ecosystem Matches — 3-column grid, all same size */}
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-beacon-cyan/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">&#x1F91D;</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-beacon-dark-teal">Your Ecosystem Matches</h2>
                  <p className="text-sm text-beacon-medium-gray">Companies at The Beacon that match your innovation profile</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {visibleMatches.map((match) => (
                  <MatchCard key={match.id} match={match} locked={false} />
                ))}
                {lockedMatches.map((match) => (
                  <MatchCard key={match.id} match={match} locked={true} />
                ))}
              </div>
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
                      <span className="text-xl">&#x1F3E2;</span>
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
                        <span className="text-beacon-cyan">&#x2713;</span>
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
                    <span className="text-xl">&#x1F3A4;</span>
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
              {!showContactForm ? (
                <div className="flex flex-col sm:flex-row items-center gap-8">
                  <div className="flex-shrink-0">
                    <img
                      src="/robin.jpg"
                      alt="Robin Pauwels"
                      className="w-40 h-40 rounded-full object-cover border-4 border-white/10"
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
                    <div className="flex flex-col sm:flex-row gap-3">
                      <a
                        href="https://calendly.com/robinpauwels/meeting-30"
                        target="_blank" rel="noopener noreferrer"
                        onClick={() => trackEvent('book_visit_click', '/tryout', { analysis_id: analysisId })}
                        className="inline-flex items-center justify-center h-14 px-10 bg-beacon-orange hover:bg-beacon-orange-hover text-white uppercase tracking-widest font-medium rounded transition-all duration-300 text-sm"
                      >
                        Book a Visit with Robin &rarr;
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

function MatchCard({ match, locked }: { match: EcosystemMatch; locked: boolean }) {
  const details: MatchDetails = (match.match_details as MatchDetails) || {};
  const teaserText = details.teaser_text || null;
  const website = match.account_website;

  if (locked) {
    return (
      <div className="border-2 border-beacon-border rounded-lg relative overflow-hidden bg-white h-[240px]">
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-5 text-center">
          {match.match_category && (
            <Badge variant="cyan" className="mb-3">{match.match_category}</Badge>
          )}
          <svg className="w-6 h-6 text-beacon-dark-teal/20 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          {teaserText && (
            <p className="text-xs text-beacon-dark-teal/50 leading-relaxed max-w-[180px]">{teaserText}</p>
          )}
          <span className="text-[9px] font-mono tracking-widest uppercase text-beacon-dark-teal/30 mt-3">
            Visit to unlock
          </span>
        </div>
        <div className="blur-md select-none p-5 opacity-20">
          <div className="h-4 w-2/3 bg-beacon-border rounded mb-3" />
          <div className="h-3 w-full bg-beacon-border/50 rounded mb-2" />
          <div className="h-3 w-full bg-beacon-border/50 rounded mb-2" />
          <div className="h-3 w-4/5 bg-beacon-border/50 rounded mb-3" />
          <div className="h-3 w-2/3 bg-beacon-border/50 rounded" />
        </div>
      </div>
    );
  }

  return (
    <Card className="p-5 border-beacon-cyan/30 flex flex-col h-[240px]">
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-bold text-beacon-dark-teal leading-tight">
          {match.account_name || 'Beacon Member'}
        </h3>
        {match.match_category && <Badge variant="cyan" className="text-[9px] flex-shrink-0">{match.match_category}</Badge>}
      </div>

      {match.match_rationale && (
        <p className="text-sm text-beacon-dark-teal/70 leading-relaxed mb-3 flex-1 line-clamp-4">
          {match.match_rationale}
        </p>
      )}

      <div className="mt-auto pt-3 border-t border-beacon-border">
        {website && (
          <a
            href={website.startsWith('http') ? website : `https://${website}`}
            target="_blank" rel="noopener noreferrer"
            className="text-xs text-beacon-cyan hover:underline font-mono truncate block"
          >
            {website}
          </a>
        )}
      </div>
    </Card>
  );
}
