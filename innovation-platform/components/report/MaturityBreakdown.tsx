'use client';

import { useState } from 'react';
import { MaturityDimension } from '@/lib/types';
import Card from '@/components/ui/Card';

interface MaturityBreakdownProps {
  dimensions: MaturityDimension[];
}

const subScoreLabels: Record<string, string> = {
  rd_commitment: 'R&D Commitment',
  technology_stack_modernity: 'Tech Stack',
  ip_knowledge_creation: 'IP & Knowledge',
  technical_talent_investment: 'Technical Talent',
  new_offering_pipeline: 'New Offerings',
  market_differentiation: 'Differentiation',
  customer_centricity: 'Customer Focus',
  innovation_awards: 'Recognition',
  data_analytics_maturity: 'Data & Analytics',
  process_digitalization: 'Process Digital',
  digital_customer_experience: 'Digital CX',
  cloud_infrastructure: 'Cloud & Infra',
  ecosystem_participation: 'Ecosystem',
  startup_collaboration: 'Startup Collab',
  academic_research_links: 'Academic Links',
  cross_industry_collaboration: 'Cross-Industry',
  thought_leadership: 'Thought Leadership',
  strategic_vision_articulation: 'Strategic Vision',
  sustainability_esg_innovation: 'Sustainability',
  future_readiness: 'Future-Ready',
};

export default function MaturityBreakdown({ dimensions }: MaturityBreakdownProps) {
  const [expandedDim, setExpandedDim] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {dimensions.map((d) => {
        const subScores = d.sub_scores || {};
        // Filter out non-numeric entries (like 'insight' if it was stored there)
        const numericSubScores = Object.entries(subScores).filter(
          ([key, val]) => typeof val === 'number' && key !== 'insight'
        );
        const hasSubScores = numericSubScores.length > 0;
        const isExpanded = expandedDim === d.id;

        return (
          <Card key={d.id} className="p-6">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-bold text-beacon-dark-teal">{d.dimension_name}</h3>
                <span className="text-[10px] font-mono tracking-widest uppercase text-beacon-medium-gray">
                  Weight: {((d.weight || 0) * 100).toFixed(0)}%
                </span>
              </div>
              <div className="text-right">
                <div className="text-3xl font-black text-beacon-dark-teal">
                  {d.score?.toFixed(1) || '\u2014'}
                </div>
                <span className="text-[10px] font-mono tracking-widest uppercase text-beacon-medium-gray">/ 5.0</span>
              </div>
            </div>

            {/* Score bar */}
            <div className="w-full h-2 bg-beacon-border rounded-full mb-4">
              <div
                className="h-2 bg-beacon-cyan rounded-full transition-all duration-500"
                style={{ width: `${((d.score || 0) / 5) * 100}%` }}
              />
            </div>

            {/* Insight — the opportunity framing */}
            {d.insight && (
              <p className="text-sm font-medium text-beacon-dark-teal/80 italic mb-3">
                {d.insight}
              </p>
            )}

            {/* Evidence */}
            {d.evidence && (
              <p className="text-sm text-beacon-dark-teal/70 leading-relaxed mb-3">
                {d.evidence}
              </p>
            )}

            {/* Key findings */}
            {d.key_findings && d.key_findings.length > 0 && (
              <ul className="space-y-1 mb-3">
                {d.key_findings.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-beacon-dark-teal/60">
                    <span className="text-beacon-cyan mt-1">&bull;</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            )}

            {/* Sub-scores — expandable */}
            {hasSubScores && (
              <div className="border-t border-beacon-border pt-3">
                <button
                  onClick={() => setExpandedDim(isExpanded ? null : d.id)}
                  className="text-[10px] font-mono tracking-widest uppercase text-beacon-cyan hover:text-beacon-dark-teal transition-colors"
                >
                  {isExpanded ? 'Hide sub-scores' : 'Show sub-scores'}
                </button>

                {isExpanded && (
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    {numericSubScores.map(([key, val]) => (
                      <div key={key} className="flex items-center justify-between gap-2">
                        <span className="text-xs text-beacon-dark-teal/60 truncate">
                          {subScoreLabels[key] || key.replace(/_/g, ' ')}
                        </span>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="w-16 h-1.5 bg-beacon-border rounded-full">
                            <div
                              className="h-1.5 bg-beacon-cyan/60 rounded-full"
                              style={{ width: `${((val as number) / 5) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs font-mono text-beacon-dark-teal/70 w-6 text-right">
                            {(val as number).toFixed(1)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
