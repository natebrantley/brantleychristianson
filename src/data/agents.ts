import type { Agent } from './types';
import agentsJson from './agents.json';

const raw = agentsJson as Agent[];
raw.forEach((a, i) => {
  const expected = `/agents/${a.slug}`;
  if (a.url !== expected) {
    throw new Error(`agents.json[${i}] ${a.name}: url must be "${expected}", got "${a.url}"`);
  }
});
export const agents: Agent[] = raw;

/** Slug is firstname_lastname (e.g. nate_brantley, morgan_wiley). */
export function getAgentBySlug(slug: string): Agent | undefined {
  return agents.find((a) => a.slug === slug);
}

/** Agent profile path. Use this instead of agent.url so links never drift. */
export function getAgentProfilePath(slug: string): string {
  return `/agents/${slug}`;
}

/** Resolve agent slug from email. Returns firstname_lastname. */
export function getAgentSlugByEmail(email: string | null | undefined): string | null {
  if (!email || !email.trim()) return null;
  const normalized = email.trim().toLowerCase();
  const a = agents.find((agent) => agent.email?.toLowerCase() === normalized);
  return a?.slug ?? null;
}

/** Resolve full agent by email (for display when we only have clerk_id → users.email). */
export function getAgentByEmail(email: string | null | undefined): Agent | undefined {
  if (!email || !email.trim()) return undefined;
  const normalized = email.trim().toLowerCase();
  return agents.find((a) => a.email?.toLowerCase() === normalized);
}

export function getAgentsByLicense(license: string): Agent[] {
  return agents.filter((a) =>
    a.licenses.some((l) => l.toUpperCase().startsWith(license.toUpperCase()))
  );
}

export function getAgentsByCity(city: string): Agent[] {
  return agents.filter((a) =>
    a.cities.some((c) => c.toLowerCase() === city.toLowerCase())
  );
}

/** Unique cities across all agents, sorted (for location filter) */
export function getBrokerCities(): string[] {
  const set = new Set<string>();
  agents.forEach((a) => a.cities.forEach((c) => set.add(c.trim())));
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

/** Unique languages across all agents, sorted (for language filter) */
export function getBrokerLanguages(): string[] {
  const set = new Set<string>();
  agents.forEach((a) => a.languages.forEach((l) => set.add(l.trim())));
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}
