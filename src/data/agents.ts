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
