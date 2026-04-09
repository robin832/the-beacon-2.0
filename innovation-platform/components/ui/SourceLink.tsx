'use client';

import { AnalysisSource } from '@/lib/types';

interface SourceLinkProps {
  sourceId: string;
  sources: AnalysisSource[];
  children?: React.ReactNode;
}

/**
 * Renders an inline source reference as a clickable link.
 * Usage: <SourceLink sourceId="S1" sources={sources}>their 2024 annual report</SourceLink>
 * Or standalone: <SourceLink sourceId="S1" sources={sources} />
 */
export default function SourceLink({ sourceId, sources, children }: SourceLinkProps) {
  const source = sources.find((s) => s.id === sourceId);

  if (!source) {
    return <span className="text-beacon-medium-gray text-xs font-mono">[{sourceId}]</span>;
  }

  if (children) {
    return (
      <a
        href={source.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-beacon-cyan hover:underline"
        title={`${source.title} (${source.date || 'n.d.'}) — ${source.type?.replace(/_/g, ' ') || 'source'}`}
      >
        {children}
      </a>
    );
  }

  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-beacon-cyan hover:underline text-xs font-mono"
      title={`${source.title} (${source.date || 'n.d.'})`}
    >
      [{sourceId}]
    </a>
  );
}

/**
 * Renders text with inline [S1], [S2] references as clickable links.
 */
export function RichText({ text, sources }: { text: string; sources: AnalysisSource[] }) {
  // Split text by source references like [S1], [S2], etc.
  const parts = text.split(/(\[S\d+\])/g);

  return (
    <>
      {parts.map((part, i) => {
        const match = part.match(/^\[(S\d+)\]$/);
        if (match) {
          return <SourceLink key={i} sourceId={match[1]} sources={sources} />;
        }
        // Also handle markdown-style links: [text](url)
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}
