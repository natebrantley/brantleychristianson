/**
 * Agent (broker) type – matches src/data/agents.json
 */
export interface Agent {
  name: string;
  slug: string;
  title: string;
  phone: string;
  email: string;
  image: string;
  url: string;
  licenses: string[];
  cities: string[];
  languages: string[];
}
