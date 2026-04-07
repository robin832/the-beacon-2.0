'use client';

import { RecommendedOffering } from '@/lib/types';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';

interface RecommendedServicesProps {
  offerings: RecommendedOffering[];
}

export default function RecommendedServices({ offerings }: RecommendedServicesProps) {
  if (!offerings || offerings.length === 0) return null;

  return (
    <section className="bg-white py-20 px-6">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-beacon-dark-teal mb-12">
          What We Can Do Together
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {offerings.map((offering, i) => (
            <Card key={i} className="p-6 relative" hover>
              {i === 0 && (
                <Badge variant="default" className="absolute top-4 right-4">
                  ⭐ Best Match
                </Badge>
              )}
              <h3 className="text-lg font-bold text-beacon-dark-teal pr-24">
                {offering.offering}
              </h3>
              <p className="mt-1 text-2xl font-black text-beacon-dark-teal">
                {offering.price}
              </p>
              <p className="mt-4 text-sm text-beacon-medium-gray leading-relaxed">
                {offering.match_reason}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
