'use client';

import { RecommendedOffering } from '@/lib/types';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';

interface RecommendedServicesProps {
  offerings: RecommendedOffering[];
  beaconRelevance: string | null;
}

export default function RecommendedServices({ offerings, beaconRelevance }: RecommendedServicesProps) {
  if (!offerings || offerings.length === 0) return null;

  return (
    <section className="bg-white py-20 px-6">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-beacon-dark-teal mb-4">
          What We Can Do Together
        </h2>

        {beaconRelevance && (
          <p className="text-beacon-dark-teal/70 leading-relaxed mb-12 max-w-3xl">
            {beaconRelevance}
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {offerings.map((offering, i) => (
            <Card key={i} className="p-8 relative" hover>
              {i === 0 && (
                <Badge variant="default" className="absolute top-4 right-4">
                  ⭐ Best Match
                </Badge>
              )}
              <h3 className="text-xl font-bold text-beacon-dark-teal pr-24 mb-4">
                {offering.offering}
              </h3>
              <p className="text-sm text-beacon-dark-teal/70 leading-relaxed">
                {offering.match_reason}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
