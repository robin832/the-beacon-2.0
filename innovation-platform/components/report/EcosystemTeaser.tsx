'use client';

import { EcosystemMatch } from '@/lib/types';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import TechTag from '@/components/ui/TechTag';

interface EcosystemTeaserProps {
  matches: EcosystemMatch[];
  companyName: string;
}

export default function EcosystemTeaser({ matches, companyName }: EcosystemTeaserProps) {
  if (!matches || matches.length === 0) return null;

  const visibleMatches = matches.filter(m => m.is_visible).slice(0, 2);
  const lockedCount = Math.max(0, matches.length - visibleMatches.length);

  return (
    <section className="bg-beacon-light-gray py-20 px-6">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-beacon-dark-teal mb-4">
          Your Ecosystem at The Beacon
        </h2>
        <p className="text-beacon-medium-gray mb-12 max-w-2xl">
          {visibleMatches.length + lockedCount} companies in The Beacon&apos;s ecosystem are working on
          challenges relevant to {companyName}. Here are your top matches.
        </p>

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
                <div className="p-3 bg-white rounded mb-3">
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

        {lockedCount > 0 && (
          <div className="flex items-center gap-3 p-4 border-2 border-dashed border-beacon-border rounded-lg">
            <svg className="w-5 h-5 text-beacon-dark-teal/30 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <p className="text-sm text-beacon-dark-teal/50">
              <strong className="text-beacon-dark-teal/70">+{lockedCount} more matches</strong> — meet them all when you visit The Beacon.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
