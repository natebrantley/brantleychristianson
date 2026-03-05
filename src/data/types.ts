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

/**
 * Preferred lender – matches src/data/lenders.json
 */
export interface Lender {
  name: string;
  slug: string;
  title: string;
  company: string;
  logo?: string;
  nmls: string;
  co_nmls?: string;
  phone: string;
  email: string;
  image: string;
  url: string;
  licenses: string[];
  specialties: string[];
  address?: string;
  bio: string;
  /** Languages the lender can work in (e.g. English, Spanish). Used for filtering. */
  languages?: string[];
}
