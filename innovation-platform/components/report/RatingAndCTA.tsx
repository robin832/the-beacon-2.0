'use client';

import { useState } from 'react';
import StarRating from '@/components/ui/StarRating';
import ContactForm from '@/components/report/ContactForm';
import { trackEvent } from '@/lib/tracking';

interface RatingAndCTAProps {
  analysisId: string;
  companyName: string;
}

export default function RatingAndCTA({ analysisId, companyName }: RatingAndCTAProps) {
  const [rating, setRating] = useState(0);
  const [showForm, setShowForm] = useState(false);

  const handleRate = (value: number) => {
    setRating(value);
    setShowForm(true);
    trackEvent('rating_submitted', '/report', { rating: value });
  };

  return (
    <section id="contact-section" className="bg-beacon-light-gray py-20 px-6">
      <div className="max-w-2xl mx-auto text-center">
        {!showForm ? (
          <>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-beacon-dark-teal mb-6">
              How valuable was this analysis?
            </h2>
            <StarRating value={rating} onChange={handleRate} />
          </>
        ) : (
          <>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-beacon-dark-teal mb-2">
              Thank you!
            </h2>
            <p className="text-beacon-medium-gray mb-8">
              Ready to explore how The Beacon can accelerate your innovation?
            </p>
            <ContactForm
              analysisId={analysisId}
              companyName={companyName}
              rating={rating}
            />
          </>
        )}
      </div>
    </section>
  );
}
