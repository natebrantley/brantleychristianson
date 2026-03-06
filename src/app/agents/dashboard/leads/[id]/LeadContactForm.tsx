'use client';

import { useState } from 'react';
import Link from 'next/link';
import { LeadRecentActivity } from './LeadRecentActivity';
import { getLeadPulse, getLeadPulseLabel } from '@/lib/getLeadPulse';

export type LeadContactData = {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  email_address?: string | null;
  phone?: string | null;
  notes?: string | null;
  notes_2?: string | null;
  source?: string | null;
  timeframe?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  clerk_id?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
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

function getInitials(lead: LeadContactData): string {
  const first = (lead.first_name ?? '').trim().slice(0, 1).toUpperCase();
  const last = (lead.last_name ?? '').trim().slice(0, 1).toUpperCase();
  if (first && last) return `${first}${last}`;
  if (first) return first;
  const email = (lead.email ?? lead.email_address ?? '').trim();
  if (email) return email.slice(0, 2).toUpperCase();
  return '?';
}

export function LeadContactForm({ lead, backHref }: { lead: LeadContactData; backHref: string }) {
  const [first_name, setFirst_name] = useState(lead.first_name ?? '');
  const [last_name, setLast_name] = useState(lead.last_name ?? '');
  const [email, setEmail] = useState(lead.email ?? lead.email_address ?? '');
  const [phone, setPhone] = useState(lead.phone ?? '');
  const [notes, setNotes] = useState(lead.notes ?? '');
  const [notes_2, setNotes_2] = useState(lead.notes_2 ?? '');
  const [address, setAddress] = useState(lead.address ?? '');
  const [city, setCity] = useState(lead.city ?? '');
  const [state, setState] = useState(lead.state ?? '');
  const [zip, setZip] = useState(lead.zip ?? '');
  const [source, setSource] = useState(lead.source ?? '');
  const [timeframe, setTimeframe] = useState(lead.timeframe ?? '');
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
          notes_2: notes_2.trim() || null,
          address: address.trim() || null,
          city: city.trim() || null,
          state: state.trim() || null,
          zip: zip.trim() || null,
          source: source.trim() || null,
          timeframe: timeframe.trim() || null,
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
  const pulseLevel = getLeadPulse(lead);
  const pulseLabel = getLeadPulseLabel(pulseLevel);
  const initials = getInitials(lead);

  return (
    <div className="lead-detail">
      <nav className="lead-detail__back" aria-label="Back to leads">
        <Link href={backHref} className="lead-detail__back-link">
          ← Back to leads
        </Link>
      </nav>

      <header className="lead-detail__header">
        <span className="lead-avatar" aria-hidden>{initials}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 className="lead-detail__title">{displayName}</h1>
          <span className="lead-detail__header-badges">
            <span
              className={`lead-pulse lead-pulse--${pulseLevel}`}
              role="img"
              aria-label={pulseLabel}
              title={pulseLabel}
            />
            {lead.clerk_id ? <span className="lead-badge">Client</span> : null}
          </span>
        </div>
      </header>

      <section className="lead-detail__section" aria-label="Overview">
        <h2 className="lead-detail__section-title">Overview</h2>
        <ul className="lead-detail__meta-list">
          <li><span className="lead-detail__meta-label">Created</span> {formatDate(lead.created_at)}</li>
          <li><span className="lead-detail__meta-label">Last active</span> {formatLastActive(lead.last_login)}</li>
          <li><span className="lead-detail__meta-label">Views</span> {lead.property_views ?? '—'} <span className="lead-detail__meta-sep">·</span> <span className="lead-detail__meta-label">Inquiries</span> {lead.property_inquiries ?? '—'}</li>
          {(lead.source || lead.timeframe || lead.city || lead.address) && (
            <li>
              {lead.source && <><span className="lead-detail__meta-label">Source</span> {lead.source}</>}
              {lead.timeframe && <> <span className="lead-detail__meta-sep">·</span> <span className="lead-detail__meta-label">Timeframe</span> {lead.timeframe}</>}
              {(lead.city || lead.address) && <> <span className="lead-detail__meta-sep">·</span> <span className="lead-detail__meta-label">Location</span> {[lead.address, lead.city, lead.state].filter(Boolean).join(', ')}{lead.zip ? ` ${lead.zip}` : ''}</>}
            </li>
          )}
        </ul>
      </section>

      <LeadRecentActivity lead={lead} />

      <form onSubmit={handleSubmit} className="lead-detail__form">
        <h2 className="lead-detail__form-title">Contact & profile</h2>
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

          <label htmlFor="lead-address" className="lead-detail__label">Address</label>
          <input
            id="lead-address"
            type="text"
            className="lead-detail__input"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Street address"
            autoComplete="street-address"
          />

          <label htmlFor="lead-city" className="lead-detail__label">City</label>
          <input
            id="lead-city"
            type="text"
            className="lead-detail__input"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="City"
            autoComplete="address-level2"
          />

          <label htmlFor="lead-state" className="lead-detail__label">State</label>
          <input
            id="lead-state"
            type="text"
            className="lead-detail__input"
            value={state}
            onChange={(e) => setState(e.target.value)}
            placeholder="State"
            autoComplete="address-level1"
          />

          <label htmlFor="lead-zip" className="lead-detail__label">ZIP</label>
          <input
            id="lead-zip"
            type="text"
            className="lead-detail__input"
            value={zip}
            onChange={(e) => setZip(e.target.value)}
            placeholder="ZIP"
            autoComplete="postal-code"
          />

          <label htmlFor="lead-source" className="lead-detail__label">Source</label>
          <input
            id="lead-source"
            type="text"
            className="lead-detail__input"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="e.g. Website, referral"
          />

          <label htmlFor="lead-timeframe" className="lead-detail__label">Timeframe</label>
          <input
            id="lead-timeframe"
            type="text"
            className="lead-detail__input"
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            placeholder="e.g. 3–6 months"
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

          <label htmlFor="lead-notes_2" className="lead-detail__label lead-detail__label--full">Notes (additional)</label>
          <textarea
            id="lead-notes_2"
            className="lead-detail__input lead-detail__input--textarea"
            value={notes_2}
            onChange={(e) => setNotes_2(e.target.value)}
            placeholder="Additional notes…"
            rows={3}
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
