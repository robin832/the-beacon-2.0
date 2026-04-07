'use client';

export default function Footer() {
  return (
    <footer className="bg-beacon-dark-teal text-white py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <h3 className="font-black text-2xl tracking-tight mb-4">THE BEACON</h3>
            <p className="text-white/60 text-sm leading-relaxed">
              Antwerp&apos;s innovation hub connecting technology,
              industry, and talent.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-mono tracking-widest uppercase text-white/40 mb-4">
              Contact
            </h4>
            <div className="space-y-2 text-sm text-white/60">
              <p>Kattendijkdok-Oostkaai 22</p>
              <p>2000 Antwerp, Belgium</p>
              <p className="mt-3">info@thebeacon.eu</p>
              <p>+32 3 303 64 74</p>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-mono tracking-widest uppercase text-white/40 mb-4">
              Legal
            </h4>
            <div className="space-y-2 text-sm text-white/60">
              <p>The Beacon NV</p>
              <p>BTW BE 0760.485.937</p>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 text-center text-xs text-white/30">
          &copy; {new Date().getFullYear()} The Beacon. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
