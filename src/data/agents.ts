import type { Agent } from './types';
import agentsJson from './agents.json';

export const agents: Agent[] = agentsJson as Agent[];

export function getAgentBySlug(slug: string): Agent | undefined {
  return agents.find((a) => a.slug === slug);
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
