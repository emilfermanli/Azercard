export interface WorldmapItem {
  reportMonth: string;
  bankName: string | null;
  sourceCountry: string | null;
  sourceCountryCategory: string | null;
  targetCountry: string | null;
  targetCountryCategory: string | null;
  paymentSystem: string | null;
  isIssuing: boolean | number;
  isAcquiring: boolean | number;
  totalAmount: number;
  totalCount: number;
  sourceLatitude: number | null;
  sourceLongitude: number | null;
  targetLatitude: number | null;
  targetLongitude: number | null;
}

export interface WorldmapPaginatedResponse {
  items: WorldmapItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface WorldmapFilterParams {
  ReportMonth?: string | Date;
  BankName?: string;
  SourceCountry?: string;
  SourceCountryCategory?: string;
  TargetCountry?: string;
  TargetCountryCategory?: string;
  PaymentSystem?: string;
  IsIssuing?: boolean | number;
  IsAcquiring?: boolean | number;
  TotalAmount?: number;
  TotalCount?: number;
  Page?: number;
  PageSize?: number;
}

export interface WorldmapHeatmapParams {
  bankName?: string;
  month?: string | Date;
}

export interface WorldmapHeatmapPoint {
  country?: string | null;
  sourceCountry?: string | null;
  targetCountry?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  totalAmount?: number | null;
  totalCount?: number | null;
  value?: number | null;
}

export type WorldmapHeatmapResponse =
  | Record<string, number>
  | WorldmapHeatmapPoint[];
