import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-beacon-light-gray flex items-center justify-center px-6">
      <div className="text-center">
        <h1 className="text-8xl font-black text-beacon-dark-teal/10">404</h1>
        <h2 className="mt-4 text-2xl font-bold text-beacon-dark-teal">
          Page not found
        </h2>
        <p className="mt-2 text-beacon-medium-gray">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex h-12 px-8 items-center justify-center bg-beacon-orange hover:bg-beacon-orange-hover text-white uppercase tracking-widest font-medium rounded transition-all duration-300 text-sm"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
