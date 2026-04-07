import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Innovation Maturity Platform | The Beacon',
  description:
    'Discover your innovation potential. Get an AI-powered innovation maturity assessment and find ecosystem partners to accelerate your growth.',
  openGraph: {
    title: 'Discover Your Innovation Potential | The Beacon',
    description:
      'AI-powered innovation maturity assessment. See how you score across 5 dimensions and discover partners to help you innovate faster.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
