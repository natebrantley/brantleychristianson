'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/Button';
import { trackEvent } from '@/lib/analytics';

interface ConsultationFormProps {
  initialMessage?: string;
  submitLabel?: string;
  source?: string;
  market?: string;
  buildingName?: string;
  buildingSlug?: string;
}

export function ConsultationForm({
  initialMessage,
  submitLabel = 'Request consultation',
  source,
  market,
  buildingName,
  buildingSlug,
}: ConsultationFormProps) {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();
  const confirmationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    trackEvent('consultation_form_view', {
      path: pathname,
      source: source ?? null,
      market: market ?? null,
      building_name: buildingName ?? null,
      building_slug: buildingSlug ?? null,
    });
  }, [pathname, source, market, buildingName, buildingSlug]);

  useEffect(() => {
    if (submitted && confirmationRef.current) {
      confirmationRef.current.focus({ preventScroll: true });
    }
  }, [submitted]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = e.currentTarget;
    const payload = {
      name: (form.elements.namedItem('name') as HTMLInputElement).value,
      email: (form.elements.namedItem('email') as HTMLInputElement).value,
      phone: (form.elements.namedItem('phone') as HTMLInputElement).value,
      message: (form.elements.namedItem('message') as HTMLTextAreaElement).value,
      source: source ?? 'contact-form',
      market,
      buildingName,
      buildingSlug,
      path: pathname,
    };

    trackEvent('consultation_submit_attempt', {
      path: pathname,
      source: payload.source,
      market: payload.market ?? null,
      building_name: payload.buildingName ?? null,
      building_slug: payload.buildingSlug ?? null,
    });

    try {
      const res = await fetch('/api/consultation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(json.error || 'Something went wrong. Please try again.');
        setLoading(false);
        trackEvent('consultation_submit_error', {
          path: pathname,
          source: payload.source,
          market: payload.market ?? null,
          building_name: payload.buildingName ?? null,
          building_slug: payload.buildingSlug ?? null,
          status: res.status,
        });
        return;
      }

      setSubmitted(true);
      trackEvent('consultation_submit_success', {
        path: pathname,
        source: payload.source,
        market: payload.market ?? null,
        building_name: payload.buildingName ?? null,
        building_slug: payload.buildingSlug ?? null,
      });
    } catch {
      setError('Network error. Please try again.');
      trackEvent('consultation_submit_error', {
        path: pathname,
        source: payload.source,
        market: payload.market ?? null,
        building_name: payload.buildingName ?? null,
        building_slug: payload.buildingSlug ?? null,
        network_error: true,
      });
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div
        ref={confirmationRef}
        className="consultation-form confirmation"
        role="status"
        aria-live="polite"
        tabIndex={-1}
      >
        <p className="section-lead confirmation-message" style={{ marginBottom: 0 }}>
          Thank you. We&apos;ll be in touch shortly to schedule your consultation.
        </p>
      </div>
    );
  }

  const errorId = 'consultation-form-error';
  return (
    <form
      onSubmit={handleSubmit}
      className="consultation-form stack--md"
      aria-busy={loading}
      aria-describedby={error ? errorId : undefined}
    >
      {error && (
        <p id={errorId} className="form-error" role="alert">
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
          defaultValue={initialMessage}
          placeholder="Tell us about your real estate goals—buying, selling, or both—and your preferred market (e.g. Portland metro, SW Washington, coast, Mt. Hood)."
          rows={5}
          disabled={loading}
        />
      </div>
      <div className="consultation-form-actions">
        <Button type="submit" variant="primary" disabled={loading}>
          {loading ? 'Sending…' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
