import type { Metadata } from 'next';
import { buildPageMetadata } from '@/config/site';

export const metadata: Metadata = buildPageMetadata({
  title: 'Sign in',
  description: 'Sign in to your BCRE account. Access your dashboard, saved homes, and agent. Oregon and Washington real estate.',
  path: '/sign-in',
  ogImageAlt: 'BCRE sign in',
  robots: { index: false, follow: false },
});

export default function SignInLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
