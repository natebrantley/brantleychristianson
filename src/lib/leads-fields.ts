/**
 * Canonical public.leads schema (12 columns + marketing_opted_out_at).
 * Use these constants so all dashboards and APIs stay aligned with the table.
 */

export const LEADS_TABLE_COLUMNS = [
  'id',
  'first_name',
  'last_name',
  'email_address',
  'crmc_score',
  'phone',
  'address',
  'city',
  'state',
  'zip',
  'assigned_broker_id',
  'assigned_lender_id',
  'marketing_opted_out_at',
] as const;

export type LeadsTableColumn = (typeof LEADS_TABLE_COLUMNS)[number];

/** Comma-separated list for .select(LEADS_SELECT) — full row. */
export const LEADS_SELECT = LEADS_TABLE_COLUMNS.join(', ');

/** Subset for agent dashboard preview (list/count). */
export const LEADS_SELECT_PREVIEW = 'id, email_address, assigned_broker_id, first_name, last_name, phone';

/** Subset for client dashboard (leads linked by email). */
export const LEADS_SELECT_CLIENT = 'id, email_address';

/** Subset for lender dashboard (assigned leads + broker for display). */
export const LEADS_SELECT_LENDER = 'id, email_address, assigned_broker_id';

/** Subset for MailerLite sync (contact + location + assigned broker for agent field). */
export const LEADS_SELECT_MAILERLITE = 'id, email_address, first_name, last_name, phone, city, state, zip, address, assigned_broker_id';
