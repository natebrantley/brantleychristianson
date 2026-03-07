'use client';

import { useState } from 'react';
import Link from 'next/link';
import { LeadRecentActivity } from './LeadRecentActivity';
import { getLeadPulse, getLeadPulseLabel } from '@/lib/getLeadPulse';

export type LeadContactData = {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  email_address?: string | null;
  cinc_score?: number | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  assigned_broker_id?: string | null;
  assigned_lender_id?: string | null;
};

function getInitials(lead: LeadContactData): string {
  const first = (lead.first_name ?? '').trim().slice(0, 1).toUpperCase();
  const last = (lead.last_name ?? '').trim().slice(0, 1).toUpperCase();
  if (first && last) return `${first}${last}`;
  if (first) return first;
  const email = (lead.email_address ?? '').trim();
  if (email) return email.slice(0, 2).toUpperCase();
  return '?';
}

export function LeadContactForm({
  lead,
  backHref,
  showReassign = false,
  agents = [],
}: {
  lead: LeadContactData;
  backHref: string;
  /** Show "Assigned to" and reassign dropdown (owner dashboard) */
  showReassign?: boolean;
  agents?: { value: string; label: string }[];
}) {
  const [first_name, setFirst_name] = useState(lead.first_name ?? '');
  const [last_name, setLast_name] = useState(lead.last_name ?? '');
  const [email_address, setEmail_address] = useState(lead.email_address ?? '');
  const [phone, setPhone] = useState(lead.phone ?? '');
  const [address, setAddress] = useState(lead.address ?? '');
  const [city, setCity] = useState(lead.city ?? '');
  const [state, setState] = useState(lead.state ?? '');
  const [zip, setZip] = useState(lead.zip ?? '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [assignedBrokerId, setAssignedBrokerId] = useState(lead.assigned_broker_id ?? '');
  const [reassigning, setReassigning] = useState(false);

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
          email_address: email_address.trim() || null,
          phone: phone.trim() || null,
          address: address.trim() || null,
          city: city.trim() || null,
          state: state.trim() || null,
          zip: zip.trim() || null,
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

  const displayName = [lead.first_name, lead.last_name].filter(Boolean).join(' ').trim() || lead.email_address || 'Lead';
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
          </span>
        </div>
      </header>

      {(lead.city || lead.address) && (
        <section className="lead-detail__section" aria-label="Location">
          <h2 className="lead-detail__section-title">Location</h2>
          <p className="lead-detail__meta-list">{[lead.address, lead.city, lead.state].filter(Boolean).join(', ')}{lead.zip ? ` ${lead.zip}` : ''}</p>
        </section>
      )}

      {showReassign && (
        <section className="lead-detail__section" aria-label="Assignment">
          <h2 className="lead-detail__section-title">Assigned to</h2>
          <div className="lead-detail__grid">
            <label htmlFor="lead-assigned_broker_id" className="lead-detail__label">Broker / agent</label>
            <div className="lead-detail__reassign-row">
              <select
                id="lead-assigned_broker_id"
                className="lead-detail__input lead-detail__input--select"
                value={assignedBrokerId}
                onChange={async (e) => {
                  const value = e.target.value;
                  setReassigning(true);
                  setMessage(null);
                  try {
                    const res = await fetch(`/api/leads/${lead.id}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ assigned_broker_id: value || null }),
                    });
                    const data = await res.json().catch(() => ({}));
                    if (!res.ok) {
                      setMessage({ type: 'error', text: (data.error as string) || 'Failed to reassign' });
                      return;
                    }
                    setAssignedBrokerId(value);
                    setMessage({ type: 'success', text: 'Lead reassigned.' });
                  } finally {
                    setReassigning(false);
                  }
                }}
                disabled={reassigning || agents.length === 0}
                aria-label="Reassign lead to broker or agent"
              >
                <option value="">— Unassigned —</option>
                {assignedBrokerId && !agents.some((a) => a.value === assignedBrokerId) && (
                  <option value={assignedBrokerId}>Current: {assignedBrokerId}</option>
                )}
                {agents.map((a) => (
                  <option key={a.value} value={a.value}>{a.label}</option>
                ))}
              </select>
              {reassigning && <span className="lead-detail__reassign-status">Saving…</span>}
            </div>
          </div>
        </section>
      )}

      <LeadRecentActivity lead={lead} />

      <form onSubmit={handleSubmit} className="lead-detail__form" aria-labelledby="lead-form-title" aria-describedby={message ? 'lead-form-message' : undefined}>
        <h2 id="lead-form-title" className="lead-detail__form-title">Contact & profile</h2>
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

          <label htmlFor="lead-email_address" className="lead-detail__label">Email</label>
          <input
            id="lead-email_address"
            type="email"
            className="lead-detail__input"
            value={email_address}
            onChange={(e) => setEmail_address(e.target.value)}
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
        </div>

        {message && (
          <p id="lead-form-message" role="alert" className={message.type === 'success' ? 'lead-detail__message lead-detail__message--success' : 'lead-detail__message lead-detail__message--error'}>
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
