'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Radar,
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { MaturityDimension, AnalysisSource } from '@/lib/types';
import { RichText } from '@/components/ui/SourceLink';
import Card from '@/components/ui/Card';

interface DimensionExplorerProps {
  dimensions: MaturityDimension[];
  sources: AnalysisSource[];
}

const shortNames: Record<string, string> = {
  'R&D & Technology Investment': 'R&D & Tech',
  'Product & Service Innovation': 'Product',
  'Digital Transformation': 'Digital',
  'External Partnerships & Open Innovation': 'Partnerships',
  'Market Leadership & Strategic Vision': 'Vision',
};

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

export default function DimensionExplorer({ dimensions, sources }: DimensionExplorerProps) {
  const [activeDim, setActiveDim] = useState<string | null>(null);
  const [animated, setAnimated] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  // Trigger animation when visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setAnimated(true); },
      { threshold: 0.2 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const radarData = dimensions.map((d) => ({
    dimension: shortNames[d.dimension_name] || d.dimension_name,
    score: animated ? (Number(d.score) || 0) : 0,
    fullMark: 5,
    id: d.id,
  }));

  const activeDimension = dimensions.find((d) => d.id === activeDim);

  return (
    <div ref={sectionRef}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Radar chart */}
        <div className="lg:sticky lg:top-24">
          <div className="h-[380px]" style={{ transition: 'all 0.8s ease-out' }}>
            <ResponsiveContainer width="100%" height="100%">
              <RechartsRadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
                <PolarGrid stroke="#E5E1DB" strokeWidth={1} />
                <PolarAngleAxis
                  dataKey="dimension"
                  tick={{ fontSize: 13, fill: '#07242D', fontWeight: 700 }}
                  tickLine={false}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 5]}
                  tick={{ fontSize: 10, fill: '#A2A2A2' }}
                  tickCount={6}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#07242D',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '13px',
                    fontFamily: 'monospace',
                  }}
                  formatter={(value) => [`${Number(value).toFixed(1)} / 5.0`, 'Score']}
                />
                <Radar
                  name="Score"
                  dataKey="score"
                  stroke="#00ACD9"
                  fill="#00ACD9"
                  fillOpacity={0.2}
                  strokeWidth={2.5}
                  dot={{ r: 5, fill: '#00ACD9', stroke: '#fff', strokeWidth: 2 }}
                  animationDuration={1200}
                />
              </RechartsRadarChart>
            </ResponsiveContainer>
          </div>

          {/* Score legend below chart */}
          <div className="mt-4 space-y-2">
            {dimensions.map((d) => (
              <button
                key={d.id}
                onClick={() => setActiveDim(activeDim === d.id ? null : d.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded transition-all text-left ${
                  activeDim === d.id
                    ? 'bg-beacon-cyan/10 border-2 border-beacon-cyan/30'
                    : 'bg-beacon-light-gray border-2 border-transparent hover:border-beacon-border'
                }`}
              >
                <span className={`text-sm font-medium ${activeDim === d.id ? 'text-beacon-dark-teal' : 'text-beacon-dark-teal/70'}`}>
                  {d.dimension_name}
                </span>
                <div className="flex items-center gap-2">
                  {d.evidence_found !== undefined && (
                    <span className={`w-2 h-2 rounded-full ${d.evidence_found ? 'bg-green-400' : 'bg-yellow-400'}`} title={d.evidence_found ? 'Evidence found' : 'Limited evidence'} />
                  )}
                  <div className="w-16 h-1.5 bg-beacon-border rounded-full">
                    <div
                      className="h-1.5 bg-beacon-cyan rounded-full transition-all duration-1000"
                      style={{ width: animated ? `${((d.score || 0) / 5) * 100}%` : '0%' }}
                    />
                  </div>
                  <span className="text-sm font-bold text-beacon-dark-teal w-8 text-right font-mono">
                    {d.score?.toFixed(1)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Detail panel / dimension cards */}
        <div className="space-y-4">
          {activeDimension ? (
            <DimensionDetail dimension={activeDimension} sources={sources} onClose={() => setActiveDim(null)} />
          ) : (
            dimensions.map((d, i) => (
              <button
                key={d.id}
                onClick={() => setActiveDim(d.id)}
                className="w-full text-left"
                style={{ animation: animated ? `fadeInUp 0.4s ease-out ${i * 0.1}s both` : 'none' }}
              >
                <Card className="p-5 hover:border-beacon-dark-teal transition-colors cursor-pointer">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-beacon-dark-teal">{d.dimension_name}</h3>
                    <div className="text-2xl font-black text-beacon-dark-teal">{d.score?.toFixed(1)}</div>
                  </div>
                  {d.insight && (
                    <p className="text-sm text-beacon-dark-teal/60 italic">{d.insight}</p>
                  )}
                  <span className="text-[10px] font-mono tracking-widest uppercase text-beacon-cyan mt-2 inline-block">
                    Click to explore &rarr;
                  </span>
                </Card>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function DimensionDetail({ dimension, sources, onClose }: {
  dimension: MaturityDimension;
  sources: AnalysisSource[];
  onClose: () => void;
}) {
  const subScores = dimension.sub_scores || {};
  const numericSubScores = Object.entries(subScores).filter(
    ([key, val]) => typeof val === 'number' && key !== 'insight'
  );

  return (
    <div style={{ animation: 'fadeInUp 0.3s ease-out' }}>
      <Card className="p-6 border-beacon-cyan/30">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-beacon-dark-teal">{dimension.dimension_name}</h3>
            <span className="text-[10px] font-mono tracking-widest uppercase text-beacon-medium-gray">
              Weight: {((dimension.weight || 0) * 100).toFixed(0)}%
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-3xl font-black text-beacon-dark-teal">{dimension.score?.toFixed(1)}</div>
            <button onClick={onClose} className="text-beacon-medium-gray hover:text-beacon-dark-teal text-xl">&times;</button>
          </div>
        </div>

        {/* Score bar */}
        <div className="w-full h-2 bg-beacon-border rounded-full mb-6">
          <div
            className="h-2 bg-beacon-cyan rounded-full transition-all duration-500"
            style={{ width: `${((dimension.score || 0) / 5) * 100}%` }}
          />
        </div>

        {/* Sub-indicator scores */}
        {numericSubScores.length > 0 && (
          <div className="mb-6">
            <h4 className="text-[10px] font-mono tracking-widest uppercase text-beacon-medium-gray mb-3">
              Sub-indicator Breakdown
            </h4>
            <div className="space-y-2.5">
              {numericSubScores.map(([key, val]) => (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-beacon-dark-teal/70">
                      {subScoreLabels[key] || key.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs font-mono font-bold text-beacon-dark-teal">{(val as number).toFixed(1)}</span>
                  </div>
                  <div className="w-full h-2 bg-beacon-border rounded-full">
                    <div
                      className="h-2 bg-beacon-cyan/60 rounded-full transition-all duration-500"
                      style={{ width: `${((val as number) / 5) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Insight */}
        {dimension.insight && (
          <p className="text-sm font-medium text-beacon-dark-teal/80 italic mb-4">
            {dimension.insight}
          </p>
        )}

        {/* Evidence with inline source links */}
        {dimension.evidence && (
          <div className="mb-4">
            <h4 className="text-[10px] font-mono tracking-widest uppercase text-beacon-medium-gray mb-2">Evidence</h4>
            <p className="text-sm text-beacon-dark-teal/70 leading-relaxed">
              <RichText text={dimension.evidence} sources={sources} />
            </p>
          </div>
        )}

        {/* Key findings */}
        {dimension.key_findings && dimension.key_findings.length > 0 && (
          <div className="mb-4">
            <h4 className="text-[10px] font-mono tracking-widest uppercase text-beacon-medium-gray mb-2">Key Findings</h4>
            <ul className="space-y-1.5">
              {dimension.key_findings.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-beacon-dark-teal/60">
                  <span className="text-beacon-cyan mt-1">&bull;</span>
                  <span><RichText text={f} sources={sources} /></span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Source quality indicator */}
        <div className="flex items-center gap-3 pt-3 border-t border-beacon-border">
          {dimension.evidence_found !== undefined && (
            <span className={`flex items-center gap-1.5 text-[10px] font-mono tracking-widest uppercase ${
              dimension.evidence_found ? 'text-green-600' : 'text-yellow-600'
            }`}>
              <span className={`w-2 h-2 rounded-full ${dimension.evidence_found ? 'bg-green-400' : 'bg-yellow-400'}`} />
              {dimension.evidence_found ? 'Evidence found' : 'Limited evidence'}
            </span>
          )}
          {dimension.source_quality && (
            <span className="text-[10px] font-mono tracking-widest uppercase text-beacon-medium-gray">
              {dimension.source_quality} sources
            </span>
          )}
          {dimension.corroboration_count !== undefined && dimension.corroboration_count > 0 && (
            <span className="text-[10px] font-mono tracking-widest uppercase text-beacon-medium-gray">
              {dimension.corroboration_count} source{dimension.corroboration_count > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </Card>
    </div>
  );
}
