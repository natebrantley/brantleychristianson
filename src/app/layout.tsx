import type { Metadata } from 'next';
import { SiteHeader } from '@/layout/SiteHeader';
import { SiteFooter } from '@/layout/SiteFooter';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'Brantley Christianson Real Estate | BCRE',
  description:
    'Fiercely Independent, Strategically Driven. Luxury real estate in the Pacific Northwest.',
  openGraph: {
    title: 'Brantley Christianson Real Estate | BCRE',
    description: 'Fiercely Independent, Strategically Driven. Luxury real estate in the Pacific Northwest.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
