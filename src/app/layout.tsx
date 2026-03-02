import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
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

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {GA_MEASUREMENT_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_MEASUREMENT_ID}', {
                  anonymize_ip: true,
                  send_page_view: true,
                });
              `}
            </Script>
          </>
        )}
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
