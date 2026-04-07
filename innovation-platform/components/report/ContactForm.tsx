'use client';

import { useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { getSessionId } from '@/lib/session';
import { trackEvent } from '@/lib/tracking';

interface ContactFormProps {
  analysisId: string;
  companyName: string;
  rating: number;
}

export default function ContactForm({ analysisId, companyName, rating }: ContactFormProps) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    company_name: companyName,
    phone: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) return;

    setLoading(true);
    try {
      const sessionId = getSessionId();

      await supabase.functions.invoke('submit-lead', {
        body: {
          analysis_id: analysisId,
          session_id: sessionId,
          name: form.name,
          email: form.email,
          company_name: form.company_name,
          phone: form.phone || null,
          message: form.message || null,
          lead_type: 'booking_request',
          rating,
        },
      });

      trackEvent('book_call_click', '/report', { analysis_id: analysisId });
      setSubmitted(true);
    } catch (err) {
      console.error('Lead submission failed:', err);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <Card className="p-12 text-center">
        <div className="text-5xl mb-4">✓</div>
        <h3 className="text-2xl font-bold text-beacon-dark-teal mb-2">
          We&apos;ll be in touch!
        </h3>
        <p className="text-beacon-medium-gray">
          A member of our team will reach out within 24 hours to schedule
          your discovery call.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-8 text-left">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-mono tracking-widest uppercase text-beacon-medium-gray mb-1.5">
            Name *
          </label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full h-14 px-4 border-2 border-beacon-border font-mono bg-white rounded focus:border-beacon-cyan focus:ring-1 focus:ring-beacon-cyan focus:outline-none transition-colors text-beacon-dark-teal"
          />
        </div>

        <div>
          <label className="block text-xs font-mono tracking-widest uppercase text-beacon-medium-gray mb-1.5">
            Email *
          </label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full h-14 px-4 border-2 border-beacon-border font-mono bg-white rounded focus:border-beacon-cyan focus:ring-1 focus:ring-beacon-cyan focus:outline-none transition-colors text-beacon-dark-teal"
          />
        </div>

        <div>
          <label className="block text-xs font-mono tracking-widest uppercase text-beacon-medium-gray mb-1.5">
            Company
          </label>
          <input
            type="text"
            value={form.company_name}
            onChange={(e) => setForm({ ...form, company_name: e.target.value })}
            className="w-full h-14 px-4 border-2 border-beacon-border font-mono bg-white rounded focus:border-beacon-cyan focus:ring-1 focus:ring-beacon-cyan focus:outline-none transition-colors text-beacon-dark-teal"
          />
        </div>

        <div>
          <label className="block text-xs font-mono tracking-widest uppercase text-beacon-medium-gray mb-1.5">
            Phone (optional)
          </label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full h-14 px-4 border-2 border-beacon-border font-mono bg-white rounded focus:border-beacon-cyan focus:ring-1 focus:ring-beacon-cyan focus:outline-none transition-colors text-beacon-dark-teal"
          />
        </div>

        <div>
          <label className="block text-xs font-mono tracking-widest uppercase text-beacon-medium-gray mb-1.5">
            Message (optional)
          </label>
          <textarea
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            rows={3}
            className="w-full px-4 py-3 border-2 border-beacon-border font-mono bg-white rounded focus:border-beacon-cyan focus:ring-1 focus:ring-beacon-cyan focus:outline-none transition-colors text-beacon-dark-teal resize-none"
          />
        </div>

        <Button type="submit" variant="primary" size="large" disabled={loading} className="w-full">
          {loading ? 'Sending...' : 'Book a Discovery Call →'}
        </Button>
      </form>
    </Card>
  );
}
