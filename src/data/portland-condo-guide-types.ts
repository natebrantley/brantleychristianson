/**
 * 2026 Portland Condo Guide entry – matches portland-condo-guide.json
 */
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
