/**
 * Shared layout for market pages: optional breadcrumb, main content, optional CTA strip.
 * Use for /markets, /markets/oregon, /markets/washington, region, county, and city pages.
 */

export interface MarketLayoutProps {
  /** Optional breadcrumb nav (e.g. Markets › Oregon › Portland) */
  breadcrumb?: React.ReactNode;
  /** Main page content */
  children: React.ReactNode;
  /** Optional CTA strip at bottom (e.g. "Get in touch" + "View listings in X") */
  ctaStrip?: React.ReactNode;
}

export function MarketLayout({ breadcrumb, children, ctaStrip }: MarketLayoutProps) {
  return (
    <main className="market-layout">
      {breadcrumb && (
        <div className="market-layout__breadcrumb">
          <div className="container">{breadcrumb}</div>
        </div>
      )}
      <div className="market-layout__content">{children}</div>
      {ctaStrip && (
        <div className="market-layout__cta-strip">
          <div className="container">{ctaStrip}</div>
        </div>
      )}
    </main>
  );
}
