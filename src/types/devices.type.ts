// Devices Dashboard ("Kart aktivliyi") API tipləri
// Swagger response sxemləri boş ("OK") olduğu üçün bu tiplər real
// API cavablarından çıxarılıb (http://89.47.113.100/api/devices/*).

/** Bütün device endpoint-lərində paylaşılan filtr parametrləri. */
export type DeviceBaseFilters = {
  bankName?: string;
  regionName?: string;
  mccName?: string;
  retailCategory?: string;
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

export type DeviceXyArgs = DeviceFilterArgs & {
  xDimension: DeviceDimension;
  yDimension: DeviceDimension;
};

export type DeviceTrendArgs = DeviceBaseFilters & {
  dateFrom: string;
  dateTo: string;
  Page?: number;
  PageSize?: number;
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

export type DeviceTotal = {
  reportMonth: string;
  total: number;
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

/** trend item-i mom item-i ilə eyni strukturdadır. */
export type DeviceTrendItem = DeviceMomItem;

export type DeviceShareItem = DeviceSummaryItem & {
  sharePctByBank: number;
  sharePctByRegion: number;
  sharePctByMcc: number;
  sharePctByRetailCat: number;
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

/** Kartlar üçün kateqoriya üzrə cəmi (client-də /total çağırışlarından yığılır). */
export type DeviceCategoryTotal = {
  category: string;
  total: number;
  prevTotal: number | null;
};

/** Trend qrafiki üçün ay üzrə cəmi (client-də /total çağırışlarından yığılır). */
export type DeviceMonthlyTotal = {
  reportMonth: string;
  total: number;
};
