'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import DecorativeBackground from '@/components/layout/DecorativeBackground';
import HeroSection from '@/components/landing/HeroSection';
import ProcessSteps from '@/components/landing/ProcessSteps';
import CompanyInput from '@/components/landing/CompanyInput';

function LandingContent() {
  const searchParams = useSearchParams();
  const prefill = searchParams.get('company') || '';

  return (
    <div className="relative min-h-screen bg-beacon-light-gray flex flex-col">
      <Header />
      <main className="flex-1 relative overflow-hidden">
        <DecorativeBackground />
        <HeroSection />
        <ProcessSteps />
        <CompanyInput initialValue={prefill} />
      </main>
      <Footer />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-beacon-light-gray flex items-center justify-center">
        <p className="text-beacon-medium-gray font-mono text-sm">Loading...</p>
      </div>
    }>
      <LandingContent />
    </Suspense>
  );
}
