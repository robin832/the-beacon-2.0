'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import DecorativeBackground from '@/components/layout/DecorativeBackground';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';

const ALL_VERTICALS = [
  'Maritime & Port',
  'Chemical',
  'Technology',
  'Logistics',
  'Manufacturing',
  'Energy',
  'Food & Agri',
  'Construction',
  'Financial Services',
  'Healthcare',
  'Other',
];

export default function VerticalsPage() {
  const router = useRouter();
  const params = useParams();
  const analysisId = params.analysisId as string;

  const [selectedVerticals, setSelectedVerticals] = useState<string[]>([]);
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('analyses')
        .select('company_name, industry, confirmed_verticals')
        .eq('id', analysisId)
        .single();

      if (data) {
        setCompanyName(data.company_name);
        // Pre-select verticals: use confirmed_verticals if set, else guess from industry
        const existing = data.confirmed_verticals as string[];
        if (existing && existing.length > 0) {
          setSelectedVerticals(existing);
        } else if (data.industry) {
          // Try to match industry to a vertical
          const matched = ALL_VERTICALS.filter((v) =>
            data.industry!.toLowerCase().includes(v.toLowerCase().split(' ')[0].toLowerCase())
          );
          setSelectedVerticals(matched.length > 0 ? matched : ['Technology']);
        } else {
          setSelectedVerticals(['Technology']);
        }
      }
      setLoading(false);
    }
    load();
  }, [analysisId]);

  const toggleVertical = (v: string) => {
    setSelectedVerticals((prev) =>
      prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]
    );
  };

  const handleContinue = async () => {
    setSaving(true);
    await supabase
      .from('analyses')
      .update({ confirmed_verticals: selectedVerticals })
      .eq('id', analysisId);

    router.push(`/report/${analysisId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-beacon-light-gray flex items-center justify-center">
        <p className="text-beacon-medium-gray font-mono text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-beacon-light-gray flex flex-col">
      <Header />
      <main className="flex-1 relative overflow-hidden pt-28 pb-20 px-6">
        <DecorativeBackground />
        <div className="max-w-2xl mx-auto relative z-10">
          <Badge variant="cyan" className="mb-6">
            🤖 AI Analysis Complete
          </Badge>

          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-beacon-dark-teal mb-4">
            Confirm Your
            <br />
            Innovation Profile
          </h1>
          <p className="text-beacon-medium-gray mb-8">
            We detected the following industry verticals for{' '}
            <strong className="text-beacon-dark-teal">{companyName}</strong>.
            Adjust if needed — this helps us find the best ecosystem matches.
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
                  <span className="text-sm font-medium text-beacon-dark-teal">
                    {v}
                  </span>
                </label>
              ))}
            </div>
          </Card>

          <Button
            variant="primary"
            size="large"
            onClick={handleContinue}
            disabled={saving || selectedVerticals.length === 0}
          >
            {saving ? 'Saving...' : 'View Your Report →'}
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
}
