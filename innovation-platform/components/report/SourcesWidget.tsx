'use client';

import { useEffect, useState } from 'react';
import { AnalysisSource } from '@/lib/types';

interface SourcesWidgetProps {
  sources: AnalysisSource[];
  confidence: string | null;
  explanation: string | null;
}

const typeLabels: Record<string, string> = {
  company_website: '\u{1F3E2} Company Sources',
  news_article: '\u{1F4F0} News & Press',
  industry_report: '\u{1F3DB}\uFE0F Industry Reports',
  academic: '\u{1F393} Academic',
  patent_database: '\u{1F4CB} Patents',
  regulatory: '\u2696\uFE0F Regulatory',
  press_release: '\u{1F4E2} Press Releases',
};

function isValidHttpUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * A source is clickable only when:
 *  - it has a syntactically valid URL, AND
 *  - `verified` is true, OR `verified` is undefined (pre-verification analyses)
 * Unverified sources fall back to plain text so we never render broken links.
 */
function isSourceClickable(source: AnalysisSource): boolean {
  if (!isValidHttpUrl(source.url)) return false;
  return source.verified !== false;
}

export default function SourcesWidget({ sources, confidence, explanation }: SourcesWidgetProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  if (!sources || sources.length === 0) return null;

  // Group sources by type (fallback bucket for unknown/missing types)
  const grouped = sources.reduce<Record<string, AnalysisSource[]>>((acc, s) => {
    const key = s.type || 'other';
    (acc[key] = acc[key] || []).push(s);
    return acc;
  }, {});

  const verifiedCount = sources.filter(isSourceClickable).length;

  return (
    <>
      {/* Collapsed tab — fixed to the right edge */}
      <button
        onClick={() => setOpen(true)}
        aria-label={`Open data sources (${sources.length})`}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-40 bg-beacon-dark-teal text-white rounded-l-lg px-3 py-4 flex flex-col items-center gap-1 shadow-lg hover:bg-beacon-dark-teal/90 transition-colors"
        style={{ display: open ? 'none' : 'flex' }}
      >
        <span className="text-sm">&#x1F4CE;</span>
        <span className="text-xs font-mono font-bold">{sources.length}</span>
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/20"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Slide-out panel */}
      <aside
        className={`fixed right-0 top-0 bottom-0 z-50 w-80 bg-white border-l border-beacon-border shadow-xl transition-transform duration-300 flex flex-col ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-hidden={!open}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-beacon-border flex-shrink-0">
          <h3 className="text-xs font-mono tracking-widest uppercase text-beacon-dark-teal font-bold">
            Data Sources ({sources.length})
          </h3>
          <button
            onClick={() => setOpen(false)}
            className="text-beacon-medium-gray hover:text-beacon-dark-teal text-xl leading-none w-6 h-6 flex items-center justify-center"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        {/* Source list grouped by type */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {Object.entries(grouped).map(([type, typeSources]) => (
            <div key={type}>
              <h4 className="text-[10px] font-mono tracking-widest uppercase text-beacon-medium-gray mb-2">
                {typeLabels[type] || type.replace(/_/g, ' ')}
              </h4>
              <ul className="space-y-2">
                {typeSources.map((source) => {
                  const clickable = isSourceClickable(source);
                  const statusTitle = clickable
                    ? 'URL verified'
                    : source.verified === false
                    ? 'URL could not be verified'
                    : 'No URL available';
                  return (
                    <li key={source.id} className="flex items-start gap-2">
                      <span className="text-[9px] font-mono font-bold text-beacon-cyan bg-beacon-cyan/10 px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5">
                        {source.id}
                      </span>
                      <div className="flex-1 min-w-0">
                        {clickable ? (
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-beacon-dark-teal hover:text-beacon-cyan block leading-snug"
                          >
                            {source.title}
                          </a>
                        ) : (
                          <span className="text-xs text-beacon-dark-teal block leading-snug">
                            {source.title}
                            <span className="text-beacon-medium-gray italic ml-1">(link unavailable)</span>
                          </span>
                        )}
                        {source.date && (
                          <span className="text-[9px] font-mono text-beacon-medium-gray">{source.date}</span>
                        )}
                      </div>
                      <span className="text-[10px] flex-shrink-0 mt-0.5" title={statusTitle}>
                        {clickable ? '\u2713' : '\u26A0\uFE0F'}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        {/* Footer with confidence */}
        {(confidence || explanation) && (
          <div className="p-4 border-t border-beacon-border flex-shrink-0">
            <div className="flex items-center gap-2 mb-1">
              {confidence && (
                <span
                  className={`text-[9px] font-mono tracking-widest uppercase px-2 py-0.5 rounded ${
                    confidence === 'high'
                      ? 'bg-green-50 text-green-700'
                      : confidence === 'medium'
                      ? 'bg-yellow-50 text-yellow-700'
                      : 'bg-red-50 text-red-600'
                  }`}
                >
                  {confidence} confidence
                </span>
              )}
              <span className="text-[9px] font-mono text-beacon-medium-gray">
                {verifiedCount}/{sources.length} verified
              </span>
            </div>
            {explanation && (
              <p className="text-[10px] text-beacon-medium-gray leading-snug mt-1">{explanation}</p>
            )}
          </div>
        )}
      </aside>
    </>
  );
}
