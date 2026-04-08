'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import DecorativeBackground from '@/components/layout/DecorativeBackground';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import PageTransition from '@/components/ui/PageTransition';
import { supabase } from '@/lib/supabase';
import { getSessionId } from '@/lib/session';
import { CompanyCandidate } from '@/lib/types';

const ALL_VERTICALS = [
  'Maritime & Port', 'Chemical', 'Technology', 'Logistics',
  'Manufacturing', 'Energy', 'Food & Agri', 'Construction',
  'Financial Services', 'Healthcare', 'Other',
];

export default function VerticalsPage() {
  const router = useRouter();
  const [selectedVerticals, setSelectedVerticals] = useState<string[]>([]);
  const [company, setCompany] = useState<CompanyCandidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem('confirmed_company');
    if (!stored) {
      router.push('/');
      return;
    }
    const c = JSON.parse(stored) as CompanyCandidate;
    setCompany(c);

    // Pre-select verticals based on detected industry
    if (c.industry) {
      const matched = ALL_VERTICALS.filter((v) =>
        c.industry!.toLowerCase().includes(v.toLowerCase().split(' ')[0].toLowerCase())
      );
      setSelectedVerticals(matched.length > 0 ? matched : ['Technology']);
    } else {
      setSelectedVerticals(['Technology']);
    }
    setTimeout(() => setLoading(false), 300);
  }, [router]);

  const toggleVertical = (v: string) => {
    setSelectedVerticals((prev) =>
      prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]
    );
  };

  const handleStartAnalysis = async () => {
    if (!company || selectedVerticals.length === 0) return;
    setStarting(true);

    try {
      const sessionId = getSessionId();

      // Create the analysis record with confirmed verticals
      const { data: analysis, error: insertError } = await supabase
        .from('analyses')
        .insert({
          company_name: company.name,
          company_website: company.website,
          industry: company.industry,
          analysis_status: 'pending',
          session_id: sessionId,
          confirmed_verticals: selectedVerticals,
        })
        .select('id')
        .single();

      if (insertError) throw insertError;

      sessionStorage.setItem('analysis_id', analysis.id);

      // Trigger analysis with verticals as context
      supabase.functions.invoke('innovation-analysis', {
        body: {
          analysis_id: analysis.id,
          company_name: company.name,
          company_website: company.website,
          industry: company.industry,
          confirmed_verticals: selectedVerticals,
          session_id: sessionId,
        },
      });

      router.push('/analyzing');
    } catch (err) {
      console.error('Failed to start analysis:', err);
      setStarting(false);
    }
  };

  if (loading) {
    return <PageTransition message="Setting up" submessage="Preparing your innovation profile..." />;
  }
  if (starting) {
    return <PageTransition message="Launching analysis" submessage="Our AI is getting ready to research your company..." />;
  }
  if (!company) {
    return <PageTransition message="Loading" />;
  }

  return (
    <div className="relative min-h-screen bg-beacon-light-gray flex flex-col">
      <Header />
      <main className="flex-1 relative overflow-hidden pt-28 pb-20 px-6">
        <DecorativeBackground />
        <div className="max-w-2xl mx-auto relative z-10" style={{ animation: 'fadeInUp 0.6s ease-out' }}>
          <Badge variant="cyan" className="mb-6">02 — Refine Your Profile</Badge>

          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-beacon-dark-teal mb-4">
            Which industries
            <br />apply to you?
          </h1>
          <p className="text-beacon-medium-gray mb-8">
            Select the verticals that are relevant to{' '}
            <strong className="text-beacon-dark-teal">{company.name}</strong>.
            This helps our AI focus its research on the right industry context and find
            the most relevant ecosystem matches.
          </p>

          <Card className="p-8 mb-8">
            <div className="grid grid-cols-2 gap-3">
              {ALL_VERTICALS.map((v) => (
                <label
                  key={v}
                  className={`flex items-center gap-3 p-3 rounded border-2 cursor-pointer transition-all duration-200 ${
                    selectedVerticals.includes(v)
                      ? 'border-beacon-cyan bg-beacon-cyan/5'
                      : 'border-beacon-border hover:border-beacon-dark-teal/30'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedVerticals.includes(v)}
                    onChange={() => toggleVertical(v)}
                    className="w-5 h-5 rounded border-2 border-beacon-border text-beacon-cyan focus:ring-beacon-cyan"
                  />
                  <span className="text-sm font-medium text-beacon-dark-teal">{v}</span>
                </label>
              ))}
            </div>
          </Card>

          <Button
            variant="primary"
            size="large"
            onClick={handleStartAnalysis}
            disabled={selectedVerticals.length === 0}
          >
            Start Innovation Analysis →
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
}
