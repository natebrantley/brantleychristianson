'use client';

import { useScrollState, useNavToggle } from '@/hooks/useScrollState';
import Link from 'next/link';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/listings', label: 'Listings' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

export function SiteHeader() {
  const isScrolled = useScrollState(60);
  const { isOpen, toggle, close } = useNavToggle();

  return (
    <header
      className={`site-header ${isScrolled ? 'is-scrolled' : ''}`}
      aria-label="Site header"
    >
      <div className="site-header-inner container">
        <Link href="/" className="site-logo" onClick={close}>
          BCRE
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
          </ul>
        </nav>
      </div>
    </header>
  );
}
