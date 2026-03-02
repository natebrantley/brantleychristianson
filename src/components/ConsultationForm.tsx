'use client';

import { useState } from 'react';
import { Button } from '@/components/Button';

export function ConsultationForm() {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = e.currentTarget;
    const data = {
      name: (form.elements.namedItem('name') as HTMLInputElement).value,
      email: (form.elements.namedItem('email') as HTMLInputElement).value,
      phone: (form.elements.namedItem('phone') as HTMLInputElement).value,
      message: (form.elements.namedItem('message') as HTMLTextAreaElement).value,
    };

    try {
      const res = await fetch('/api/consultation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(json.error || 'Something went wrong. Please try again.');
        setLoading(false);
        return;
      }
      setSubmitted(true);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="consultation-form confirmation" role="status">
        <p className="section-lead" style={{ marginBottom: 0 }}>
          Thank you. We&apos;ll be in touch shortly to schedule your consultation.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="consultation-form stack--md">
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="form-group">
        <label htmlFor="consult-name">Name *</label>
        <input
          type="text"
          id="consult-name"
          name="name"
          required
          autoComplete="name"
          placeholder="Your name"
          disabled={loading}
        />
      </div>
      <div className="form-group">
        <label htmlFor="consult-email">Email *</label>
        <input
          type="email"
          id="consult-email"
          name="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          disabled={loading}
        />
      </div>
      <div className="form-group">
        <label htmlFor="consult-phone">Phone</label>
        <input
          type="tel"
          id="consult-phone"
          name="phone"
          autoComplete="tel"
          placeholder="(503) 555-0123"
          disabled={loading}
        />
      </div>
      <div className="form-group">
        <label htmlFor="consult-message">How can we help? *</label>
        <textarea
          id="consult-message"
          name="message"
          required
          placeholder="Tell us about your real estate goals—buying, selling, or both—and your preferred market (e.g. Portland metro, SW Washington, coast, Mt. Hood)."
          rows={5}
          disabled={loading}
        />
      </div>
      <Button type="submit" variant="primary" disabled={loading}>
        {loading ? 'Sending…' : 'Request consultation'}
      </Button>
    </form>
  );
}
