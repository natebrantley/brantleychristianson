/**
 * BCRE Master Manifest – central configuration
 * "Fiercely Independent, Strategically Driven."
 * Pacific Northwest–inspired luxury tokens.
 */

export const theme = {
  colors: {
    primary: '#0a2438',
    primaryRgb: '10, 36, 56',
    accent: '#c5a059',
    accentRgb: '197, 160, 89',
    light: '#ffffff',
    dark: '#000000',
    lightAlt: '#f9f9f9',
    muted: 'rgba(10, 36, 56, 0.65)',
  },
  typography: {
    body: 'Quasimoda, "Helvetica Neue", system-ui, sans-serif',
    headings: 'Tenso, "Helvetica Neue", system-ui, sans-serif',
    display: '"Arno Pro Display", Georgia, serif',
  },
  layout: {
    headerHeight: 'clamp(56px, 8vw, 72px)',
    spaceXxs: '4px',
    spaceXs: '8px',
    spaceSm: '16px',
    spaceMd: '20px',
    spaceLg: '28px',
    spaceXl: '36px',
    spaceXxl: '48px',
    heroOffset: 'clamp(48px, 8vh, 80px)',
  },
  breakpoints: {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1200,
  },
} as const;

/** All media is hosted under /public/media/ (URL base: /media/). */
export const assetPaths = {
  /** Base URL for all media assets */
  media: '/media',
  /** Broker headshots: /media/img/brokers/{filename} */
  brokers: '/media/img/brokers',
  /** Listing images: /media/img/listings/{filename} */
  listings: '/media/img/listings',
  /** Region/hub images: /media/img/hubs/{filename} */
  hubs: '/media/img/hubs',
} as const;

export type StackGap = 'sm' | 'md' | 'lg' | 'xl' | 'xxl';

export const stackGapMap: Record<StackGap, string> = {
  sm: 'var(--space-sm)',
  md: 'var(--space-md)',
  lg: 'var(--space-lg)',
  xl: 'var(--space-xl)',
  xxl: 'var(--space-xxl)',
};
