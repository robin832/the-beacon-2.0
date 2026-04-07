'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import DecorativeBackground from '@/components/layout/DecorativeBackground';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { CompanyCandidate } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { getSessionId } from '@/lib/session';

export default function ConfirmPage() {
  const router = useRouter();
  const [candidates, setCandidates] = useState<CompanyCandidate[]>([]);
  const [selected, setSelected] = useState(0);
  const [loading, setLoading] = useState(false);
  const [originalInput, setOriginalInput] = useState('');

  useEffect(() => {
    const stored = sessionStorage.getItem('company_lookup');
    const input = sessionStorage.getItem('company_name_input');
    if (!stored) {
      router.push('/');
      return;
    }
    const data = JSON.parse(stored);
    setCandidates(data.candidates || []);
    setOriginalInput(input || '');
  }, [router]);

  const handleConfirm = async () => {
    const company = candidates[selected];
    if (!company) return;

    setLoading(true);
    try {
      const sessionId = getSessionId();

      // Create analysis record with pending status
      const { data: analysis, error: insertError } = await supabase
        .from('analyses')
        .insert({
          company_name: company.name,
          company_website: company.website,
          industry: company.industry,
          analysis_status: 'pending',
          session_id: sessionId,
        })
        .select('id')
        .single();

      if (insertError) throw insertError;

      // Store analysis ID and trigger the analysis
      sessionStorage.setItem('analysis_id', analysis.id);
      sessionStorage.setItem('confirmed_company', JSON.stringify(company));

      // Call the innovation-analysis edge function (fire-and-forget — we'll poll via realtime)
      supabase.functions.invoke('innovation-analysis', {
        body: {
          analysis_id: analysis.id,
          company_name: company.name,
          company_website: company.website,
          industry: company.industry,
          session_id: sessionId,
        },
      });

      router.push('/analyzing');
    } catch (err) {
      console.error('Failed to start analysis:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTryAgain = () => {
    router.push(`/?company=${encodeURIComponent(originalInput)}`);
  };

  if (candidates.length === 0) {
    return (
      <div className="min-h-screen bg-beacon-light-gray flex items-center justify-center">
        <p className="text-beacon-medium-gray">Loading...</p>
      </div>
    );
  }

  const primary = candidates[selected];

  return (
    <div className="relative min-h-screen bg-beacon-light-gray flex flex-col">
      <Header />
      <main className="flex-1 relative overflow-hidden pt-28 pb-20 px-6">
        <DecorativeBackground />
        <div className="max-w-2xl mx-auto relative z-10">
          <Badge variant="cyan" className="mb-6">
            🔍 Company Identified
          </Badge>

          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-beacon-dark-teal mb-8">
            {primary.name}
          </h1>

          {candidates.length > 1 && (
            <div className="mb-6">
              <p className="text-xs font-mono tracking-widest uppercase text-beacon-medium-gray mb-3">
                Multiple matches found — select the correct one
              </p>
              <div className="grid gap-3">
                {candidates.map((c, i) => (
                  <Card
                    key={i}
                    className={`p-4 cursor-pointer ${
                      i === selected
                        ? 'border-beacon-cyan bg-beacon-cyan/5'
                        : ''
                    }`}
                    hover
                  >
                    <button
                      className="w-full text-left"
                      onClick={() => setSelected(i)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-beacon-dark-teal">
                          {c.name}
                        </span>
                        <span className="text-xs font-mono text-beacon-medium-gray">
                          {Math.round(c.confidence * 100)}% match
                        </span>
                      </div>
                      {c.industry && (
                        <span className="text-sm text-beacon-medium-gray">
                          {c.industry}
                        </span>
                      )}
                    </button>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <Card className="p-8 mb-8">
            <div className="space-y-4">
              {primary.website && (
                <div>
                  <span className="text-xs font-mono tracking-widest uppercase text-beacon-medium-gray">
                    Website
                  </span>
                  <p className="text-beacon-dark-teal">{primary.website}</p>
                </div>
              )}
              {primary.industry && (
                <div>
                  <span className="text-xs font-mono tracking-widest uppercase text-beacon-medium-gray">
                    Industry
                  </span>
                  <p className="text-beacon-dark-teal">{primary.industry}</p>
                </div>
              )}
              {primary.headquarters && (
                <div>
                  <span className="text-xs font-mono tracking-widest uppercase text-beacon-medium-gray">
                    Headquarters
                  </span>
                  <p className="text-beacon-dark-teal">{primary.headquarters}</p>
                </div>
              )}
              {primary.description && (
                <div>
                  <span className="text-xs font-mono tracking-widest uppercase text-beacon-medium-gray">
                    Description
                  </span>
                  <p className="text-beacon-dark-teal text-sm leading-relaxed">
                    {primary.description}
                  </p>
                </div>
              )}
            </div>
          </Card>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              variant="primary"
              size="large"
              onClick={handleConfirm}
              disabled={loading}
            >
              {loading ? 'Starting...' : "Yes, That's Us →"}
            </Button>
            <Button variant="outline" onClick={handleTryAgain}>
              No, Try Again
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
