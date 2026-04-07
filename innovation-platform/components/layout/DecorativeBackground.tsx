'use client';

const plusPositions = [
  { top: '8%', left: '5%' },
  { top: '15%', right: '8%' },
  { top: '35%', left: '3%' },
  { top: '45%', right: '12%' },
  { top: '55%', left: '10%' },
  { top: '65%', right: '5%' },
  { top: '75%', left: '7%' },
  { top: '85%', right: '9%' },
  { top: '25%', left: '15%' },
  { top: '92%', left: '4%' },
];

export default function DecorativeBackground() {
  return (
    <>
      {/* Plus grid */}
      {plusPositions.map((pos, i) => (
        <span
          key={i}
          className="absolute text-beacon-dark-teal/10 text-2xl font-mono select-none pointer-events-none"
          style={pos}
        >
          +
        </span>
      ))}

      {/* Geometric SVG — bottom right */}
      <svg
        className="absolute bottom-0 right-0 w-64 h-64 opacity-[0.03] pointer-events-none"
        viewBox="0 0 200 200"
      >
        <rect
          x="60"
          y="60"
          width="80"
          height="80"
          fill="none"
          stroke="#07242D"
          strokeWidth="2"
          transform="rotate(45 100 100)"
        />
        <circle
          cx="100"
          cy="100"
          r="60"
          fill="none"
          stroke="#07242D"
          strokeWidth="2"
        />
      </svg>
    </>
  );
}
