/**
 * Repliers.io API helpers (server-side only).
 * Used to create/update clients when consultation form is submitted.
 */

const REPLIERS_BASE = 'https://api.repliers.io';

export interface RepliersConfig {
  fetch: (url: string, init?: RequestInit) => Promise<Response>;
  agentId: number;
}

/**
 * Returns configured Repliers client and default agentId, or null if not configured.
 */
export function repliersClient(): RepliersConfig | null {
  const apiKey = process.env.REPLIERS_API_KEY;
  const agentIdRaw = process.env.REPLIERS_DEFAULT_AGENT_ID;
  if (!apiKey || !agentIdRaw) return null;
  const agentId = parseInt(agentIdRaw, 10);
  if (Number.isNaN(agentId)) return null;

  const fetchWithAuth = (url: string, init: RequestInit = {}) =>
    fetch(url, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        'REPLIERS-API-KEY': apiKey,
        ...(init.headers as Record<string, string>),
      },
    });

  return { fetch: fetchWithAuth, agentId };
}

/**
 * Normalize phone to 11 digits (1 + 10 digits) for Repliers. Returns null if invalid.
 */
export function normalizePhoneForRepliers(phone: string): string | null {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return digits;
  return null;
}

/**
 * Split full name into first name and last name (first word = fname, rest = lname).
 */
export function parseNameToFnameLname(name: string): { fname: string; lname: string } {
  const trimmed = name.trim();
  if (!trimmed) return { fname: '', lname: '' };
  const firstSpace = trimmed.indexOf(' ');
  if (firstSpace === -1) return { fname: trimmed, lname: '' };
  return {
    fname: trimmed.slice(0, firstSpace),
    lname: trimmed.slice(firstSpace + 1).trim(),
  };
}

/** Response shape from GET /clients (filter clients) */
interface RepliersClientsResponse {
  results?: Array<{ clientId?: number; [key: string]: unknown }>;
  clients?: Array<{ clientId?: number; [key: string]: unknown }>;
}

/**
 * Find a client by email. Returns the first match or null.
 */
export async function findClientByEmail(
  config: RepliersConfig,
  email: string
): Promise<{ clientId: number } | null> {
  const url = `${REPLIERS_BASE}/clients?email=${encodeURIComponent(email)}&resultsPerPage=1`;
  const res = await config.fetch(url);
  if (!res.ok) return null;
  const data = (await res.json().catch(() => ({}))) as RepliersClientsResponse;
  const list = data.results ?? data.clients ?? (Array.isArray(data) ? data : []);
  const first = list[0];
  const id = first?.clientId ?? (first as { id?: number })?.id;
  if (typeof id === 'number') return { clientId: id };
  return null;
}

export interface CreateClientPayload {
  agentId: number;
  fname: string;
  lname: string;
  email: string;
  phone?: string | null;
  tags?: string[];
  externalId?: string;
}

/**
 * Create a new Repliers client.
 */
export async function createClient(
  config: RepliersConfig,
  payload: CreateClientPayload
): Promise<{ ok: boolean }> {
  const body: Record<string, unknown> = {
    agentId: payload.agentId,
    fname: payload.fname || undefined,
    lname: payload.lname || undefined,
    email: payload.email,
    status: true,
  };
  if (payload.phone) body.phone = payload.phone;
  if (payload.tags && payload.tags.length > 0) body.tags = payload.tags;
  if (payload.externalId) body.externalId = payload.externalId;

  const res = await config.fetch(`${REPLIERS_BASE}/clients`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message ?? `Repliers createClient ${res.status}`);
  }
  return { ok: true };
}

export interface UpdateClientPayload {
  fname?: string;
  lname?: string;
  email?: string;
  phone?: string | null;
  tags?: string[];
}

/**
 * Update an existing Repliers client.
 */
export async function updateClient(
  config: RepliersConfig,
  clientId: number,
  payload: UpdateClientPayload
): Promise<{ ok: boolean }> {
  const body: Record<string, unknown> = {};
  if (payload.fname !== undefined) body.fname = payload.fname;
  if (payload.lname !== undefined) body.lname = payload.lname;
  if (payload.email !== undefined) body.email = payload.email;
  if (payload.phone !== undefined) body.phone = payload.phone || undefined;
  if (payload.tags !== undefined) body.tags = payload.tags;

  const res = await config.fetch(`${REPLIERS_BASE}/clients/${clientId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message ?? `Repliers updateClient ${res.status}`);
  }
  return { ok: true };
}
