import type { Metadata } from 'next';
import { buildPageMetadata } from '@/config/site';

export const metadata: Metadata = buildPageMetadata({
  title: 'Create account',
  description: 'Create a free BCRE account to save homes, get listing alerts, and connect with an agent in Oregon or Washington.',
  path: '/sign-up',
  ogImageAlt: 'BCRE create account',
  robots: { index: false, follow: false },
});

export default function SignUpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
