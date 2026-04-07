'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { getOrCreateSession } from '@/lib/session';
import { supabase } from '@/lib/supabase';

interface CompanyInputProps {
  initialValue?: string;
}

export default function CompanyInput({ initialValue = '' }: CompanyInputProps) {
  const [companyName, setCompanyName] = useState(initialValue);
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !consent) return;

    setLoading(true);
    setError(null);

    try {
      const sessionId = await getOrCreateSession();

      const { data, error: fnError } = await supabase.functions.invoke('company-lookup', {
        body: { company_name: companyName.trim(), session_id: sessionId },
      });

      if (fnError) throw fnError;

      // Store lookup results in sessionStorage for the confirm page
      sessionStorage.setItem('company_lookup', JSON.stringify(data));
      sessionStorage.setItem('company_name_input', companyName.trim());
      router.push('/confirm');
    } catch (err) {
      console.error('Company lookup failed:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="max-w-2xl mx-auto px-6 pb-20">
      <Card className="p-8 sm:p-12">
        <form onSubmit={handleSubmit}>
          <label className="block text-xs font-mono tracking-widest uppercase text-beacon-medium-gray mb-3">
            Company Name
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Port of Antwerp-Bruges"
              className="flex-1 h-14 px-4 border-2 border-beacon-border font-mono bg-white rounded focus:border-beacon-cyan focus:ring-1 focus:ring-beacon-cyan focus:outline-none transition-colors text-beacon-dark-teal placeholder:text-beacon-medium-gray/50"
            />
            <Button
              type="submit"
              variant="primary"
              size="large"
              disabled={!companyName.trim() || !consent || loading}
            >
              {loading ? 'Searching...' : 'Start Analysis →'}
            </Button>
          </div>

          <label className="flex items-start gap-3 mt-4 cursor-pointer">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 w-5 h-5 rounded border-2 border-beacon-border text-beacon-cyan focus:ring-beacon-cyan"
            />
            <span className="text-xs text-beacon-medium-gray leading-relaxed">
              I agree that The Beacon may collect and process the data provided here to
              generate my innovation assessment. This data will be handled in accordance
              with GDPR regulations.
            </span>
          </label>

          {error && (
            <p className="mt-3 text-sm text-red-600">{error}</p>
          )}
        </form>
      </Card>
    </section>
  );
}
