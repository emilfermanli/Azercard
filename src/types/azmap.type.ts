export interface AzmapItem {
  reportMonth: string;
  bankName: string | null;
  sourceCity: string | null;
  sourceCityClean: string | null;
  sourceCityCategory: string | null;
  totalAmount: number;
  totalCount: number;
}

export interface AzmapFilterResponse {
  items: AzmapItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface AzmapFilterParams {
  BankName?: string;
  SourceCity?: string;
  SourceCityClean?: string;
  SourceCityCategory?: string;
  ReportMonth?: string | Date;
  Page?: number;
  PageSize?: number;
}

export interface AzmapHeatmapParams {
  bankName?: string;
  sourceCity?: string;
  month?: string | Date;
}
