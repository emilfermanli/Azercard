export interface AzmapItem {
  reportMonth: string;
  city?: string | null;
  bankName: string | null;
  sourceCity: string | null;
  sourceCityClean: string | null;
  sourceCityCategory: string | null;
  totalAmount: number;
  totalCount: number;
  latitude: number | null;
  longitude: number | null;
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
  AcquiringDeviceType?: string;
  TransGroup?: string;
  OperationType?: string;
  TokenStatus?: string;
  Mcc?: string;
  IsAcquiringCategory?: string;
  TargetBankName?: string;
  SourceBankName?: string;
  TargetCity?: string;
  PaymentSystem?: string;
  ReportMonth?: string | Date;
  StartDate?: string | Date;
  EndDate?: string | Date;
  Page?: number;
  PageSize?: number;
}

export interface AzmapFilterOptionsResponse {
  acquiringDeviceTypes: string[];
  transGroups: string[];
  operationTypes: string[];
  tokenStatuses: string[];
  mccs: string[];
  isAcquiringCategories: string[];
  targetBankNames: string[];
  sourceBankNames: string[];
  targetCities: string[];
  paymentSystems: string[];
}

export interface AzmapHeatmapParams {
  bankName?: string;
  sourceCity?: string;
  month?: string | Date;
}
