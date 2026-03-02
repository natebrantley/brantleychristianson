/**
 * 2026 Portland Condo Guide entry – matches portland-condo-guide.json
 */

/** Color coding reflects the building’s financial security (cost burden), not market speed. */
export const CONDITION_COLOR_LEGEND = {
  RED:
    'Higher financial load: special assessment and/or HOA in the top 25% most expensive.',
  YELLOW:
    'Moderate: HOA and taxes neither in the top 25% nor in the bottom 50%.',
  GREEN:
    'Strong financial position: HOA and taxes in the bottom 50% least expensive, and no special assessment.',
} as const;

export type ConditionColorCode = keyof typeof CONDITION_COLOR_LEGEND;

export interface PortlandCondoEntry {
  id: string;
  name: string;
  neighborhood: string;
  categoryId: string;
  address: string;
  yearBuilt: number;
  stories: number;
  amenities: string[];
  averageMonthlyHoa: number;
  activeListings: number;
  totalTransactions: number;
  medianPrice: number;
  avgPricePerSqFt: number;
  highestPrice: number;
  lowestPrice: number;
  medianDaysOnMarket: number;
  rentCap: string;
  shortTermRental: string;
  concierge: string;
  parking: string;
  image: string;
  url: string;
  colorCode: 'GREEN' | 'YELLOW' | 'RED';
  taxPriceRatio: number;
  hoaPriceRatio: number;
  specialAssessment: string;
}

export type NeighborhoodFilter = string; // categoryId or 'all'
