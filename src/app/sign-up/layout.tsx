import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create account',
  description: 'Create an account to save homes and connect with an agent.',
  robots: { index: false, follow: false },
};

export default function SignUpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
