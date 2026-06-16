// AcquiringDevice ("Acquiring qurğu əməliyyatları") API tipləri — /api/AcquiringDevice/*
// Swagger response sxemləri boş ("OK") olduğu üçün real cavablardan çıxarılıb.
// Müqavilə: docs/acquiring-device-transaction.md

/** trend endpointinin qəbul etdiyi ölçülər (snake_case, DB sütunlarına uyğun). */
export type AcquiringTrendDimension =
  | 'trans_group'
  | 'payment_system'
  | 'source_bank_name'
  | 'target_bank_name'
  | 'operation_type'
  | 'mcc'
  | 'is_acquiring_category';

/**
 * Bütün AcquiringDevice endpoint-lərində paylaşılan filtr parametrləri (API PascalCase).
 * Çox seçimli → massiv; boş massiv = filtr yoxdur.
 */
export type AcquiringApiFilters = {
  AcquiringDeviceTypes?: string[];
  TransGroups?: string[];
  OperationTypes?: string[];
  TokenStatuses?: string[];
  Mccs?: string[];
  AcquiringCategories?: string[];
  TargetBankNames?: string[];
  SourceBankNames?: string[];
  TargetCities?: string[];
  PaymentSystems?: string[];
  ContactlessStatuses?: string[];
};

/** Tarix aralığı + kateqoriya/məbləğ parametrləri (ISO "YYYY-MM-DDT00:00:00"). */
export type AcquiringRangeArgs = AcquiringApiFilters & {
  FromDate: string;
  ToDate: string;
  Category?: string;
  AmountUnit?: string;
};

export type AcquiringDashboardArgs = AcquiringRangeArgs;

export type AcquiringTrendArgs = AcquiringRangeArgs & {
  Dimension: AcquiringTrendDimension;
  DimValues?: string[];
  Granularity: string;
};

// --- Cavablar ---

export type AcquiringFilterOptions = {
  acquiringDeviceTypes: string[];
  transGroups: string[];
  operationTypes: string[];
  tokenStatuses: string[];
  mccs: string[];
  acquiringCategories: string[];
  targetBanks: string[];
  sourceBanks: string[];
  targetCities: string[];
  paymentSystems: string[];
  contactlessStatuses: string[];
  minDate: string;
  maxDate: string;
};

/** Sağ rəngli kartlar — ACQUIRING_DEVICE_TYPE üzrə yekun göstəricilər. */
export type AcquiringDeviceSummaryItem = {
  deviceType: string;
  volume: number;
  count: number;
  avgAmount: number;
};

/** Pay (donut) qrafiki — qurğu tipi üzrə bölgü. */
export type AcquiringPieItem = {
  label: string;
  value: number;
  count: number;
  percent: number;
};

export type AcquiringTransGroupItem = {
  transGroup: string;
  value: number;
  count: number;
  percent: number;
};

export type AcquiringPaymentSysItem = {
  paymentSystem: string;
  value: number;
  count: number;
  percent: number;
};

export type AcquiringBankItem = {
  bankName: string;
  value: number;
  count: number;
  percent: number;
};

export type AcquiringDashboard = {
  deviceSummary: AcquiringDeviceSummaryItem[];
  pieChart: AcquiringPieItem[];
  transGroupChart: AcquiringTransGroupItem[];
  paymentSysChart: AcquiringPaymentSysItem[];
  sourceBankChart: AcquiringBankItem[];
  targetBankChart: AcquiringBankItem[];
};

export type AcquiringTrendPoint = {
  period: string;
  actual: number;
  forecast: number;
  isForecast: boolean;
  forecastLower: number;
  forecastUpper: number;
  forecastAccuracy: number;
  forecastModel: string | null;
};

export type AcquiringTrendSeries = {
  label: string;
  points: AcquiringTrendPoint[];
};

export type AcquiringTrend = {
  series: AcquiringTrendSeries[];
};
