'use client';

import Card from '@/components/ui/Card';

const steps = [
  {
    number: '01',
    title: 'Enter Your Company',
    description: 'Just type your company name. Our AI does the rest.',
  },
  {
    number: '02',
    title: 'Get Your Analysis',
    description:
      'We scan public data to assess your innovation maturity across 5 dimensions.',
  },
  {
    number: '03',
    title: 'Find Your Matches',
    description:
      'Discover Beacon members who can help you innovate faster.',
  },
];

export default function ProcessSteps() {
  return (
    <section className="max-w-5xl mx-auto px-6 py-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {steps.map((step) => (
          <Card key={step.number} className="p-8" hover>
            <span className="font-mono text-4xl font-light text-beacon-dark-teal/20">
              {step.number}
            </span>
            <h3 className="mt-4 text-xl font-bold text-beacon-dark-teal">
              {step.title}
            </h3>
            <p className="mt-2 text-beacon-medium-gray text-sm leading-relaxed">
              {step.description}
            </p>
          </Card>
        ))}
      </div>
    </section>
  );
}
