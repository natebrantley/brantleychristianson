'use client';

/**
 * VOW (Virtual Office Website) sign-up page with RMLS-required disclosure.
 * Users must acknowledge MLS data terms before creating an account.
 */

import { useState } from 'react';
import { SignUp } from '@clerk/nextjs';
import Link from 'next/link';

const VOW_DISCLOSURE =
  'By registering, you agree to the Terms of Use, acknowledging that the MLS data provided is exclusively for your personal, non-commercial use, and you have a bona fide interest in the purchase, sale, or lease of real estate of the type being offered.';

export default function SignUpPage() {
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="section" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 1rem' }}>
      <div className="container container-narrow" style={{ maxWidth: '28rem', width: '100%' }}>
        {/* VOW disclosure: required acknowledgment before account creation */}
        <section
          className="vow-disclosure"
          style={{ background: 'var(--color-light-alt)', border: '1px solid rgba(10,36,56,0.12)', marginBottom: '1.5rem' }}
          aria-label="MLS data terms"
        >
          <h2>MLS data use</h2>
          <p>{VOW_DISCLOSURE}</p>
          <label>
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              aria-describedby="vow-disclosure-desc"
            />
            <span id="vow-disclosure-desc">
              I agree to the Terms of Use and acknowledge that MLS data is for my personal, non-commercial use and
              that I have a bona fide interest in the purchase, sale, or lease of real estate of the type being
              offered.
            </span>
          </label>
        </section>

        {agreed ? (
          <SignUp
            appearance={{
              elements: {
                rootBox: 'w-full',
                card: 'shadow-lg border border-slate-200',
              },
            }}
            fallbackRedirectUrl="/dashboard"
          />
        ) : (
          <div className="vow-pending-message" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', color: '#92400e' }}>
            <p style={{ margin: 0, fontWeight: 600 }}>Account creation requires agreement above.</p>
            <p style={{ margin: '0.25rem 0 0 0' }}>Check the box to continue to the registration form.</p>
          </div>
        )}

        <p className="text-center stack--md" style={{ marginTop: '1.5rem', fontSize: '0.9375rem' }}>
          Already have an account?{' '}
          <Link href="/sign-in" className="button button--text">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
