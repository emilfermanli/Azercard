// Devices Dashboard ("Kart aktivliyi") API tipləri
// Swagger response sxemləri boş ("OK") olduğu üçün bu tiplər real
// API cavablarından çıxarılıb (http://89.47.113.100/api/devices/*).

/**
 * Filtr parametrləri — summary/mom/xy-analysis çox seçimli (massiv) qəbul edir.
 * Boş massiv = filtr yoxdur.
 */
export type DeviceBaseFilters = {
  bankNames?: string[];
  regionNames?: string[];
  mccNames?: string[];
  retailCategories?: string[];
};

/** `reportMonth` formatı: "YYYY-MM-01T00:00:00" (ayın 1-i). */
export type DeviceFilterArgs = DeviceBaseFilters & {
  reportMonth: string;
};

export type DevicePagedArgs = DeviceFilterArgs & {
  Page?: number;
  PageSize?: number;
};

/** xy-analysis üçün ölçü dəyərləri. x === y → backend 500 qaytarır. */
export type DeviceDimension =
  | 'bank_name'
  | 'region_name'
  | 'mcc_name'
  | 'retail_category';

export type DeviceXyArgs = DeviceBaseFilters & {
  dateFrom: string;
  dateTo: string;
  xDimension: DeviceDimension;
  yDimension: DeviceDimension;
};

/** trend — tarix aralığı + ölçü üzrə seriya qaytarır (bank/region/mcc qəbul etmir). */
export type DeviceTrendArgs = {
  dateFrom: string;
  dateTo: string;
  dimension?: DeviceDimension;
  dimensionValues?: string[];
};

/**
 * share — tarix aralığı + bank/region/mcc/retail filtrləri + bir ölçü üzrə bölgü.
 * Verilmədikdə backend tək cəm ("All") sətri qaytarır.
 */
export type DeviceShareArgs = DeviceBaseFilters & {
  dateFrom: string;
  dateTo: string;
  dimension?: DeviceDimension;
  dimensionValues?: string[];
};

/** Standart səhifələnmiş cavab zərfi (summary, mom, share, trend). */
export type DevicePaginated<T> = {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

export type DeviceLatestMonth = {
  reportMonth: string;
};

export type DeviceFilters = {
  bankNames: string[];
  regionNames: string[];
  mccNames: string[];
  retailCategories: string[];
};

export type DeviceTotalCategory = {
  retailCategory: string;
  totalDevices: number;
};

export type DeviceTotal = {
  reportMonth: string;
  total: number;
  /** Kateqoriya üzrə bölgü (kartlar üçün — tək sorğuda gəlir). */
  categories: DeviceTotalCategory[];
};

/** summary/mom/share item-lərinin ortaq əsas sahələri. */
export type DeviceRecordBase = {
  reportMonth: string;
  bankName: string;
  regionName: string;
  mccName: string;
  retailCategory: string;
  transactionClass: string | null;
  ctlsStatus: string | null;
  totalDevices: number;
};

export type DeviceSummaryItem = DeviceRecordBase & {
  grandTotalMonth: number;
};

export type DeviceMomItem = DeviceRecordBase & {
  prevMonthDevices: number;
  momDiff: number;
  momPctChange: number;
};

/** trend cavabı — ölçü dəyəri üzrə (label) seriya, hər birində ay-nöqtələri. */
export type DeviceTrendPoint = {
  period: string;
  count: number;
  prevMonthDevices: number;
  momDiff: number;
  momPctChange: number;
};

export type DeviceTrendSeries = {
  label: string;
  points: DeviceTrendPoint[];
};

export type DeviceTrendResponse = {
  series: DeviceTrendSeries[];
};

/** share massiv qaytarır: seçilmiş ölçünün hər dəyəri üzrə cihaz sayı və pay. */
export type DeviceShareItem = {
  dimensionValue: string;
  totalDevices: number;
  sharePct: number;
};

/** xy-analysis massiv qaytarır (səhifələnmir). momDiff/momPctChange null ola bilər. */
export type DeviceXyItem = {
  xValue: string;
  yValue: string;
  deviceCount: number;
  sharePct: number;
  momDiff: number | null;
  momPctChange: number | null;
};
