import type { Metadata, Viewport } from 'next';
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

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0a2438',
  viewportFit: 'cover',
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
