'use client';

import Link from 'next/link';

export default function Header({ variant = 'light' }: { variant?: 'light' | 'dark' }) {
  const logo = variant === 'dark' ? '/logo-white.png' : '/logo-dark.png';

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 ${variant === 'dark' ? 'bg-beacon-dark-teal' : 'bg-beacon-light-gray border-b border-beacon-border'}`}>
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <img src={logo} alt="The Beacon" className="h-8" />
        </Link>
        <nav className="hidden sm:flex items-center gap-6">
          <span className={`text-xs font-mono tracking-widest uppercase ${variant === 'dark' ? 'text-white/40' : 'text-beacon-medium-gray'}`}>
            Innovation Maturity Platform
          </span>
        </nav>
      </div>
    </header>
  );
}
