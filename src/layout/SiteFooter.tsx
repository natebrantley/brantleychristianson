'use client';

import Link from 'next/link';

export function SiteFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="site-footer" role="contentinfo">
      <div className="site-footer-inner footer-inner">
        <p className="footer-copyright">
          © {currentYear} Brantley Christianson Real Estate. Fiercely Independent, Strategically Driven.
        </p>
        <div className="footer-legal">
          <p>
            <Link href="/privacy">Privacy</Link> · <Link href="/terms">Terms</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
