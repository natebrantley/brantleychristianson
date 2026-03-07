import type { Metadata } from 'next';

/**
 * Site-wide SEO and social sharing defaults.
 * Used for metadataBase, default OG image, and canonical URLs.
 */

export const SITE_URL = 'https://brantleychristianson.com';
export const SITE_NAME = 'Brantley Christianson Real Estate';

/** Default OG/Twitter share image (1200×630 recommended for best display) */
export const DEFAULT_OG_IMAGE = `${SITE_URL}/media/img/markets/pdx_skyline_2.jpeg`;
export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;

/** Default description for fallback / layout */
export const DEFAULT_DESCRIPTION =
  'Fiercely Independent, Strategically Driven. Luxury real estate across Oregon and Washington. Portland metro, SW Washington, coast & Mt. Hood.';

/** Default Open Graph image entry for use in page metadata */
export function defaultOgImage(alt: string = SITE_NAME) {
  return {
    url: DEFAULT_OG_IMAGE,
    width: OG_IMAGE_WIDTH,
    height: OG_IMAGE_HEIGHT,
    alt,
  };
}

/** Absolute URL for a path (e.g. for person images in profile metadata) */
export function absoluteUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_URL}${p}`;
}

/** Social title: "Page Title | Brantley Christianson Real Estate" */
export function socialTitle(pageTitle: string): string {
  return `${pageTitle} | ${SITE_NAME}`;
}

export interface PageMetadataOptions {
  title: string;
  description: string;
  path: string;
  ogImageAlt?: string;
  robots?: Metadata['robots'];
}

/** Build full page metadata with canonical, Open Graph, and Twitter for consistent SEO and sharing. */
export function buildPageMetadata({
  title,
  description,
  path,
  ogImageAlt,
  robots,
}: PageMetadataOptions): Metadata {
  const canonical = path.startsWith('http') ? path : `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  const image = defaultOgImage(ogImageAlt ?? title);
  const ogTitle = socialTitle(title);
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: canonical,
      siteName: SITE_NAME,
      title: ogTitle,
      description,
      images: [image],
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description,
      images: [image.url],
    },
    ...(robots && { robots }),
  };
}
