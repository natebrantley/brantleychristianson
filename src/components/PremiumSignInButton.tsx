'use client';

import { SignInButton } from '@clerk/nextjs';

type PremiumSignInButtonProps = {
  redirectUrl: string;
  children?: React.ReactNode;
  className?: string;
};

/**
 * Sign-in CTA for premium pages. Redirects back to the given URL after sign-in.
 */
export function PremiumSignInButton({
  redirectUrl,
  children = 'Sign in to access',
  className = 'button button--primary',
}: PremiumSignInButtonProps) {
  return (
    <SignInButton mode="modal" fallbackRedirectUrl={redirectUrl}>
      <button type="button" className={className} aria-label="Sign in to access premium content">
        {children}
      </button>
    </SignInButton>
  );
}
