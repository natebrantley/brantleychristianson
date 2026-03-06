'use client';

import { useState } from 'react';
import Link from 'next/link';

export type LeadContactData = {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  email_address?: string | null;
  phone?: string | null;
  notes?: string | null;
  source?: string | null;
  timeframe?: string | null;
  city?: string | null;
  state?: string | null;
  clerk_id?: string | null;
  created_at?: string | null;
  last_login?: string | null;
  property_views?: number | null;
  property_inquiries?: number | null;
};

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

function formatLastActive(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return '—';
  }
}

export function LeadContactForm({ lead, backHref }: { lead: LeadContactData; backHref: string }) {
  const [first_name, setFirst_name] = useState(lead.first_name ?? '');
  const [last_name, setLast_name] = useState(lead.last_name ?? '');
  const [email, setEmail] = useState(lead.email ?? lead.email_address ?? '');
  const [phone, setPhone] = useState(lead.phone ?? '');
  const [notes, setNotes] = useState(lead.notes ?? '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/leads/${lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: first_name.trim() || null,
          last_name: last_name.trim() || null,
          email: email.trim() || null,
          phone: phone.trim() || null,
          notes: notes.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ type: 'error', text: (data.error as string) || 'Failed to save' });
        return;
      }
      setMessage({ type: 'success', text: 'Contact information saved.' });
    } finally {
      setSaving(false);
    }
  }

  const displayName = [lead.first_name, lead.last_name].filter(Boolean).join(' ').trim() || lead.email || lead.email_address || 'Lead';

  return (
    <div className="lead-detail">
      <nav className="lead-detail__back" aria-label="Back to leads">
        <Link href={backHref} className="lead-detail__back-link">
          ← Back to leads
        </Link>
      </nav>

      <header className="lead-detail__header">
        <h1 className="lead-detail__title">{displayName}</h1>
        {lead.clerk_id ? <span className="lead-badge">Client</span> : null}
      </header>

      <section className="lead-detail__meta" aria-label="Activity summary">
        <ul className="lead-detail__meta-list">
          <li><span className="lead-detail__meta-label">Created</span> {formatDate(lead.created_at)}</li>
          <li><span className="lead-detail__meta-label">Last active</span> {formatLastActive(lead.last_login)}</li>
          <li><span className="lead-detail__meta-label">Views</span> {lead.property_views ?? '—'} <span className="lead-detail__meta-sep">·</span> <span className="lead-detail__meta-label">Inquiries</span> {lead.property_inquiries ?? '—'}</li>
          {(lead.source || lead.timeframe || lead.city) && (
            <li>
              {lead.source && <><span className="lead-detail__meta-label">Source</span> {lead.source}</>}
              {lead.timeframe && <> <span className="lead-detail__meta-sep">·</span> <span className="lead-detail__meta-label">Timeframe</span> {lead.timeframe}</>}
              {lead.city && <> <span className="lead-detail__meta-sep">·</span> <span className="lead-detail__meta-label">Location</span> {lead.city}{lead.state ? `, ${lead.state}` : ''}</>}
            </li>
          )}
        </ul>
      </section>

      <form onSubmit={handleSubmit} className="lead-detail__form">
        <h2 className="lead-detail__form-title">Contact information</h2>
        <div className="lead-detail__grid">
          <label htmlFor="lead-first_name" className="lead-detail__label">First name</label>
          <input
            id="lead-first_name"
            type="text"
            className="lead-detail__input"
            value={first_name}
            onChange={(e) => setFirst_name(e.target.value)}
            placeholder="First name"
            autoComplete="given-name"
          />

          <label htmlFor="lead-last_name" className="lead-detail__label">Last name</label>
          <input
            id="lead-last_name"
            type="text"
            className="lead-detail__input"
            value={last_name}
            onChange={(e) => setLast_name(e.target.value)}
            placeholder="Last name"
            autoComplete="family-name"
          />

          <label htmlFor="lead-email" className="lead-detail__label">Email</label>
          <input
            id="lead-email"
            type="email"
            className="lead-detail__input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@example.com"
            autoComplete="email"
          />

          <label htmlFor="lead-phone" className="lead-detail__label">Phone</label>
          <input
            id="lead-phone"
            type="tel"
            className="lead-detail__input"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone"
            autoComplete="tel"
          />

          <label htmlFor="lead-notes" className="lead-detail__label lead-detail__label--full">Notes</label>
          <textarea
            id="lead-notes"
            className="lead-detail__input lead-detail__input--textarea"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes about this lead…"
            rows={4}
          />
        </div>

        {message && (
          <p role="alert" className={message.type === 'success' ? 'lead-detail__message lead-detail__message--success' : 'lead-detail__message lead-detail__message--error'}>
            {message.text}
          </p>
        )}

        <div className="lead-detail__actions">
          <button type="submit" className="button button--primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
