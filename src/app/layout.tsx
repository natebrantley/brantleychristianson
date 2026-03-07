import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { Analytics } from '@vercel/analytics/next';
import { ClerkProvider } from '@clerk/nextjs';
import { SiteHeader } from '@/layout/SiteHeader';
import { SiteHeaderPublic } from '@/layout/SiteHeaderPublic';
import { SiteFooter } from '@/layout/SiteFooter';
import { SITE_URL, SITE_NAME, DEFAULT_DESCRIPTION } from '@/config/site';
import '@/styles/globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
    url: SITE_URL,
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0a2438',
  viewportFit: 'cover',
};

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const CLERK_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

const BodyContent = ({ children }: { children: React.ReactNode }) => (
  <>
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
    <a href="#main-content" className="skip-link">
      Skip to main content
    </a>
    {CLERK_PUBLISHABLE_KEY ? <SiteHeader /> : <SiteHeaderPublic />}
    <div id="main-content" tabIndex={-1}>
      {children}
    </div>
    <SiteFooter />
    <Analytics />
  </>
);

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const body = (
    <html lang="en">
      <body>
        <BodyContent>{children}</BodyContent>
      </body>
    </html>
  );

  if (!CLERK_PUBLISHABLE_KEY) {
    return body;
  }

  return <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>{body}</ClerkProvider>;
}
