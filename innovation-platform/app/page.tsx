'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import DecorativeBackground from '@/components/layout/DecorativeBackground';
import HeroSection from '@/components/landing/HeroSection';
import ProcessSteps from '@/components/landing/ProcessSteps';
import CompanyInput from '@/components/landing/CompanyInput';
import PageTransition from '@/components/ui/PageTransition';

function LandingContent() {
  const searchParams = useSearchParams();
  const prefill = searchParams.get('company') || '';
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  if (searching) {
    return (
      <PageTransition
        message="Identifying your company"
        submessage="Our AI is searching the web for your company details..."
      />
    );
  }

  return (
    <div className="relative min-h-screen bg-beacon-light-gray flex flex-col">
      <Header />
      <main className="flex-1 relative overflow-hidden">
        <DecorativeBackground />
        <HeroSection />
        <ProcessSteps />
        {searchError && (
          <div className="max-w-2xl mx-auto px-6 mb-4">
            <div className="p-4 rounded border-2 border-red-200 bg-red-50 text-sm text-red-700">
              {searchError}
            </div>
          </div>
        )}
        <CompanyInput
          initialValue={prefill}
          onSearchStart={() => { setSearchError(null); setSearching(true); }}
          onSearchError={(msg) => { setSearching(false); setSearchError(msg); }}
        />
      </main>
      <Footer />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <PageTransition message="Loading" />
    }>
      <LandingContent />
    </Suspense>
  );
}
