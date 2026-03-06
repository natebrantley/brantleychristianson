'use client';

import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Button } from '@/components/Button';

interface AssignLenderButtonProps {
  slug: string;
  label?: string;
  variant?: 'primary' | 'outline' | 'text';
  className?: string;
}

export function AssignLenderButton({ slug, label = 'Choose as my lender', variant = 'outline', className = '' }: AssignLenderButtonProps) {
  const { isSignedIn } = useAuth();
  const [loading, setLoading] = useState(false);

  if (!isSignedIn) return null;

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch('/api/me/lender', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? 'Failed to assign');
      }
      // Full navigation so dashboard loads fresh from server with updated lender
      window.location.href = '/dashboard';
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }

  return (
    <Button variant={variant} className={className} onClick={handleClick} disabled={loading}>
      {loading ? 'Saving…' : label}
    </Button>
  );
}
