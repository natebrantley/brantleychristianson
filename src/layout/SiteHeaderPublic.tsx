'use client';

import { useEffect } from 'react';
import { useScrollState, useNavToggle } from '@/hooks/useScrollState';
import Link from 'next/link';
import Image from 'next/image';
import { assetPaths } from '@/config/theme';

const LOGO_SRC = `${assetPaths.logos}/BCRE-White-Trans.png`;

const NAV_LINKS = [
  { href: '/markets', label: 'Markets' },
  { href: '/agents', label: 'Agents' },
  { href: '/lenders', label: 'Lenders' },
  { href: '/about', label: 'About' },
  { href: '/social', label: 'Social' },
];

/**
 * Header used when Clerk is not configured (e.g. Vercel build without env vars).
 * Same look as SiteHeader but no auth components — Sign in is a plain link to /sign-in.
 */
export function SiteHeaderPublic() {
  const isScrolled = useScrollState(60);
  const { isOpen, toggle, close } = useNavToggle();

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, close]);

  return (
    <header
      className={`site-header ${isScrolled ? 'is-scrolled' : ''}`}
      aria-label="Site header"
    >
      <div className="site-header-inner container">
        <Link href="/" className="site-logo" onClick={close} aria-label="Brantley Christianson Real Estate – Home">
          <Image
            src={LOGO_SRC}
            alt="Brantley Christianson Real Estate logo"
            width={160}
            height={48}
            priority
            className="site-logo-img"
          />
        </Link>
        <button
          type="button"
          className="nav-toggle"
          onClick={toggle}
          aria-expanded={isOpen}
          aria-controls="site-nav"
          aria-label={isOpen ? 'Close menu' : 'Open menu'}
        >
          <span aria-hidden>{isOpen ? '✕' : '☰'}</span>
        </button>
        <nav
          id="site-nav"
          className={`site-nav main-nav ${isOpen ? 'is-open' : ''}`}
          aria-label="Main"
        >
          <ul className="nav-list">
            {NAV_LINKS.map(({ href, label }) => (
              <li key={href}>
                <Link href={href} onClick={close}>
                  {label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/dashboard" onClick={close}>
                Dashboard
              </Link>
            </li>
            <li className="nav-signin-item">
              <Link href="/sign-in" className="btn btn-primary nav-signin-btn w-full md:btn-ghost md:w-auto" onClick={close}>
                Sign in
              </Link>
            </li>
          </ul>
          <div className="nav-close-wrap">
            <button
              type="button"
              onClick={close}
              className="nav-close-btn"
              aria-label="Close menu"
            >
              Close menu
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
}
