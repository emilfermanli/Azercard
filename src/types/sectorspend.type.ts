export interface SectorSpendItem {
  reportMonth: string;
  bankName: string | null;
  mccGroup: string | null;
  mcc: string | null;
  sourceCity: string | null;
  sourceCityCategory: string | null;
  sourceChannel: string | null;
  operationType: string | null;
  sourceCountryCategory: string | null;
  isAcquiring: number | null;
  isIssuing: number | null;
  totalAmount: number;
  totalCount: number;
  totalLocalAmount: number;
  avgTicket: number;
  localRatioPct: number;
  sectorMarketSharePct: number;
}

export interface SectorSpendPaginatedResponse {
  items: SectorSpendItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface SectorSpendFilterParams {
  bankName?: string;
  month?: string | Date;
  mccGroup?: string;
  sourceChannel?: string;
  operationType?: string;
  sourceCityCategory?: string;
  sourceCountryCategory?: string;
  isAcquiring?: number;
  isIssuing?: number;
  page?: number;
  pageSize?: number;
}

export interface SectorSpendTopMccParams {
  bankName: string;
  month: string | Date;
  topN?: number;
}

export interface SectorSpendTrendParams {
  bankName: string;
  mccGroup: string;
}

export interface SectorSpendTrendItem {
  reportMonth: string;
  totalAmount: number;
  totalCount: number;
  avgTicket: number;
  sectorMarketSharePct: number;
}

export interface SectorSpendChannelDistributionParams {
  bankName: string;
  month: string | Date;
}

export type SectorSpendChannelDistributionResponse = Record<string, number>;
