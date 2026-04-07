'use client';

import Link from 'next/link';

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-beacon-light-gray border-b border-beacon-border">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-beacon-dark-teal font-black text-xl tracking-tight">
            THE BEACON
          </span>
        </Link>
        <nav className="hidden sm:flex items-center gap-6">
          <span className="text-xs font-mono tracking-widest uppercase text-beacon-medium-gray">
            Innovation Maturity Platform
          </span>
        </nav>
      </div>
    </header>
  );
}
