'use client';

interface PageTransitionProps {
  message?: string;
  submessage?: string;
}

export default function PageTransition({
  message = 'Loading...',
  submessage,
}: PageTransitionProps) {
  return (
    <div className="fixed inset-0 z-50 bg-beacon-light-gray flex items-center justify-center">
      <div className="text-center">
        {/* Animated beacon dot */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div
              className="w-4 h-4 rounded-full bg-beacon-cyan"
              style={{ animation: 'beaconGlow 2s ease-in-out infinite' }}
            />
            <div
              className="absolute inset-0 w-4 h-4 rounded-full bg-beacon-cyan/30"
              style={{ animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite' }}
            />
          </div>
        </div>

        <p className="text-lg font-bold text-beacon-dark-teal">{message}</p>
        {submessage && (
          <p className="mt-2 text-sm text-beacon-medium-gray">{submessage}</p>
        )}
      </div>
    </div>
  );
}
