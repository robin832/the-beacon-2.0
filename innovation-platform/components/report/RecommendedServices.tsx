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
    <section className="bg-beacon-light-gray py-20 px-6">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-beacon-dark-teal mb-4">
          How The Beacon Can Help
        </h2>

        {beaconRelevance && (
          <p className="text-beacon-dark-teal/70 leading-relaxed mb-12 max-w-3xl">
            {beaconRelevance}
          </p>
        )}

        <div className="space-y-4">
          {offerings.map((offering, i) => (
            <Card key={i} className="p-6 sm:p-8" hover>
              <div className="flex items-start gap-4">
                {i === 0 && <Badge variant="default" className="flex-shrink-0">Best Match</Badge>}
                <div>
                  <h3 className="text-lg font-bold text-beacon-dark-teal">{offering.offering}</h3>
                  <p className="mt-2 text-sm text-beacon-dark-teal/70 leading-relaxed">
                    {offering.match_reason}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
