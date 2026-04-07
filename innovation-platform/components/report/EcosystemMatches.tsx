'use client';

import { EcosystemMatch } from '@/lib/types';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import TechTag from '@/components/ui/TechTag';
import { trackEvent } from '@/lib/tracking';

interface EcosystemMatchesProps {
  matches: EcosystemMatch[];
}

function VisibleMatchCard({ match }: { match: EcosystemMatch }) {
  return (
    <Card className="p-8">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-2xl font-bold text-beacon-dark-teal">
            {match.account_name || 'Beacon Member'}
          </h3>
          {match.match_category && (
            <Badge variant="cyan" className="mt-2">
              {match.match_category}
            </Badge>
          )}
        </div>
        <div className="text-right">
          <div className="text-3xl font-black text-beacon-dark-teal">
            {match.match_score ? `${Math.round(match.match_score * 100)}%` : '—'}
          </div>
          <span className="text-[10px] font-mono tracking-widest uppercase text-beacon-medium-gray">
            Match
          </span>
        </div>
      </div>

      {match.match_rationale && (
        <p className="text-sm text-beacon-dark-teal/70 leading-relaxed mb-4">
          {match.match_rationale}
        </p>
      )}

      {match.shared_themes.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {match.shared_themes.map((theme, i) => (
            <TechTag key={i} label={theme} />
          ))}
        </div>
      )}

      {match.collaboration_idea && (
        <p className="text-sm text-beacon-medium-gray leading-relaxed italic">
          {match.collaboration_idea}
        </p>
      )}
    </Card>
  );
}

function LockedMatchCard({ match }: { match: EcosystemMatch }) {
  const handleClick = () => {
    trackEvent('unlock_matches_click', '/report', {
      match_rank: match.match_rank,
    });
  };

  return (
    <Card className="p-8 relative overflow-hidden cursor-pointer group" hover>
      <button onClick={handleClick} className="w-full text-left">
        {/* Blur overlay */}
        <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
          <svg className="w-10 h-10 text-beacon-dark-teal/30 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span className="text-xs font-mono tracking-widest uppercase text-beacon-dark-teal/40 group-hover:text-beacon-dark-teal/60 transition-colors">
            Unlock
          </span>
        </div>

        {/* Blurred content */}
        <div className="blur-sm select-none">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-2xl font-bold text-beacon-dark-teal">
                ████████ ██████
              </h3>
              {match.match_category && (
                <Badge variant="cyan" className="mt-2">
                  {match.match_category}
                </Badge>
              )}
            </div>
            <div className="text-3xl font-black text-beacon-dark-teal">
              ██%
            </div>
          </div>
          <p className="text-sm text-beacon-dark-teal/70">
            A {match.match_category?.toLowerCase() || 'partner'} with strong alignment
            to your innovation profile...
          </p>
        </div>
      </button>
    </Card>
  );
}

export default function EcosystemMatches({ matches }: EcosystemMatchesProps) {
  const visible = matches.filter((_, i) => i < 2);
  const locked = matches.filter((_, i) => i >= 2);

  return (
    <section className="bg-beacon-light-gray py-20 px-6">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-beacon-dark-teal mb-12">
          Your Innovation Ecosystem
        </h2>

        <div className="space-y-6">
          {/* Visible matches */}
          {visible.map((match) => (
            <VisibleMatchCard key={match.id} match={match} />
          ))}

          {/* Locked matches */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {locked.map((match) => (
              <LockedMatchCard key={match.id} match={match} />
            ))}
          </div>
        </div>

        {/* CTA banner */}
        {locked.length > 0 && (
          <div className="mt-12 bg-beacon-dark-teal rounded-lg p-8 sm:p-12 text-center">
            <h3 className="text-2xl font-bold text-white mb-3">
              Unlock all matches and accelerate your innovation journey
            </h3>
            <p className="text-white/60 mb-6">
              Get full access to all ecosystem matches, detailed collaboration
              opportunities, and direct introductions.
            </p>
            <button
              onClick={() => {
                trackEvent('cta_click', '/report', { cta: 'unlock_all' });
                document.getElementById('contact-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="h-14 px-10 bg-beacon-orange hover:bg-beacon-orange-hover text-white uppercase tracking-widest font-medium rounded transition-all duration-300"
            >
              Get Started →
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
