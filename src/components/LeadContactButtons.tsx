'use client';

import Link from 'next/link';

/**
 * Call, Text, and Email buttons for a lead's contact info.
 * - Links use the lead's phone and email.
 * - Buttons are red when phone/email is bad or missing.
 * - Email button is color-coded by opt-in: opted-in (green), opted-out or missing (red), unknown (neutral).
 */

function isPhoneUsable(phone: string | null | undefined): boolean {
  if (!phone || !phone.trim()) return false;
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10;
}

function isEmailUsable(email: string | null | undefined): boolean {
  return Boolean(email && email.trim());
}

export type LeadContactButtonsProps = {
  phone?: string | null;
  email?: string | null;
  /** When set, lead has opted out of marketing — email button red. */
  marketingOptedOutAt?: string | null;
  variant: 'table' | 'mobile';
  /** For mobile: base path to lead detail (e.g. /owners/dashboard/leads). Omit to hide View profile. */
  viewProfileHref?: string;
};

export function LeadContactButtons({
  phone,
  email,
  marketingOptedOutAt,
  variant,
  viewProfileHref,
}: LeadContactButtonsProps) {
  const phoneOk = isPhoneUsable(phone);
  const emailOk = isEmailUsable(email);
  const optedOut = Boolean(marketingOptedOutAt);
  const emailStatus: 'opted-in' | 'opted-out' | 'missing' | 'unknown' = !emailOk
    ? 'missing'
    : optedOut
      ? 'opted-out'
      : 'opted-in';

  const phoneHref = phoneOk ? `tel:${(phone ?? '').replace(/\D/g, '')}` : undefined;
  const smsHref = phoneOk ? `sms:${(phone ?? '').replace(/\D/g, '')}` : undefined;
  const mailtoHref = emailOk ? `mailto:${(email ?? '').trim()}` : undefined;

  const btnClass = (
    kind: 'call' | 'text' | 'email',
    bad: boolean,
    emailStatusVal?: 'opted-in' | 'opted-out' | 'missing' | 'unknown'
  ) => {
    const base = variant === 'table' ? 'lead-contact-btn' : 'leads-mobile-card__btn';
    const mod = variant === 'table' ? `lead-contact-btn--${kind}` : `leads-mobile-card__btn--${kind}`;
    const badClass = variant === 'table' ? 'lead-contact-btn--bad' : 'leads-mobile-card__btn--bad';
    const emailMod =
      kind === 'email' && variant === 'table' && emailStatusVal
        ? ` lead-contact-btn--email-${emailStatusVal}`
        : kind === 'email' && variant === 'mobile' && emailStatusVal
          ? ` leads-mobile-card__btn--email-${emailStatusVal}`
          : '';
    return `${base} ${mod}${bad ? ` ${badClass}` : ''}${emailMod}`.trim();
  };

  if (variant === 'table') {
    return (
      <div className="lead-contact-btns" role="group" aria-label="Contact lead">
        <a
          href={phoneHref ?? '#'}
          className={btnClass('call', !phoneOk)}
          aria-label={phoneOk ? `Call ${phone}` : 'Phone missing or invalid'}
          title={phoneOk ? `Call ${phone}` : 'Phone missing or invalid'}
          {...(!phoneHref && { 'aria-disabled': true, onClick: (e) => e.preventDefault() })}
        >
          Call
        </a>
        <a
          href={smsHref ?? '#'}
          className={btnClass('text', !phoneOk)}
          aria-label={phoneOk ? `Text ${phone}` : 'Phone missing or invalid'}
          title={phoneOk ? `Text ${phone}` : 'Phone missing or invalid'}
          {...(!smsHref && { 'aria-disabled': true, onClick: (e) => e.preventDefault() })}
        >
          Text
        </a>
        <a
          href={mailtoHref ?? '#'}
          className={btnClass('email', !emailOk || optedOut, emailStatus)}
          aria-label={
            emailOk
              ? optedOut
                ? `Email ${email} (opted out)`
                : `Email ${email}`
              : 'Email missing'
          }
          title={
            emailOk
              ? optedOut
                ? `Email ${email} (opted out of marketing)`
                : `Email ${email}`
              : 'Email missing'
          }
          {...(!mailtoHref && { 'aria-disabled': true, onClick: (e) => e.preventDefault() })}
        >
          Email
        </a>
      </div>
    );
  }

  return (
    <div className="leads-mobile-card__actions">
      <a
        href={phoneHref ?? '#'}
        className={btnClass('call', !phoneOk)}
        aria-label={phoneOk ? `Call ${phone}` : 'Phone missing or invalid'}
        {...(!phoneHref && { 'aria-disabled': true, onClick: (e) => e.preventDefault() })}
      >
        Call
      </a>
      <a
        href={smsHref ?? '#'}
        className={btnClass('text', !phoneOk)}
        aria-label={phoneOk ? `Text ${phone}` : 'Phone missing or invalid'}
        {...(!smsHref && { 'aria-disabled': true, onClick: (e) => e.preventDefault() })}
      >
        Text
      </a>
      <a
        href={mailtoHref ?? '#'}
        className={btnClass('email', !emailOk || optedOut, emailStatus)}
        aria-label={
          emailOk ? (optedOut ? `Email ${email} (opted out)` : `Email ${email}`) : 'Email missing'
        }
        {...(!mailtoHref && { 'aria-disabled': true, onClick: (e) => e.preventDefault() })}
      >
        Email
      </a>
      {viewProfileHref && (
        <Link href={viewProfileHref} className="leads-mobile-card__btn leads-mobile-card__btn--view">
          View profile
        </Link>
      )}
    </div>
  );
}
