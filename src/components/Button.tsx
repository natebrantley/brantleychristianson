'use client';

import Link from 'next/link';

export type ButtonVariant = 'primary' | 'white' | 'outline' | 'text';

export interface ButtonProps {
  variant?: ButtonVariant;
  href?: string;
  children: React.ReactNode;
  className?: string;
  type?: 'button' | 'submit';
  disabled?: boolean;
  'aria-label'?: string;
}

export function Button({
  variant = 'primary',
  href,
  children,
  className = '',
  type = 'button',
  disabled,
  'aria-label': ariaLabel,
}: ButtonProps) {
  const variantClass = `button--${variant}`;
  const classes = ['button', variantClass, className].filter(Boolean).join(' ');

  if (href) {
    return (
      <Link href={href} className={classes} aria-label={ariaLabel}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
}
