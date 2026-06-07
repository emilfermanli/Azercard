// CardPortfolio ("Kart portfoliyosu") API tipləri — /api/cards/*
// Swagger response sxemləri boş ("OK") olduğu üçün real cavablardan çıxarılıb.

export type CardDimension =
  | 'payment_scheme'
  | 'product_type'
  | 'bank_name'
  | 'region_name'
  | 'contactless_status'
  | 'exp_status'
  | 'card_product_name';

/** Bütün cards endpoint-lərində paylaşılan filtr parametrləri (API PascalCase). */
export type CardApiFilters = {
  BankName?: string;
  RegionName?: string;
  PaymentScheme?: string;
  ProductType?: string;
  ContactlessStatus?: string;
  ExpStatus?: string;
  BaseCurrency?: string;
  CardProductName?: string;
};

/** Tarix aralığı (ayın 1-i, "YYYY-MM-01T00:00:00"). */
export type CardRangeArgs = CardApiFilters & {
  FromMonth: string;
  ToMonth: string;
};

export type CardPayChartArgs = CardRangeArgs & { Dimension: CardDimension };
export type CardXyChartArgs = CardRangeArgs & {
  XDimension: CardDimension;
  YDimension: CardDimension;
};
export type CardTrendArgs = CardRangeArgs & {
  Dimension: CardDimension;
  DimValue: string;
  Granularity: string;
};

// --- Cavablar ---

export type CardFilterOptions = {
  banks: string[];
  regions: string[];
  paymentSchemes: string[];
  productTypes: string[];
  contactlessStatuses: string[];
  expStatuses: string[];
  status3Ds: Array<string | null>;
  currencies: string[];
  cardProducts: string[];
  minMonth: string;
  maxMonth: string;
};

export type CardScheme = {
  paymentScheme: string;
  totalCards: number;
  sharePercent: number;
  momChange: number;
  momIsUp: boolean;
  shareIsUp: boolean;
  salary: number;
  credit: number;
  social: number;
  other: number;
};

export type CardTopSchemes = {
  grandTotal: number;
  schemes: CardScheme[];
};

export type CardPayChartItem = {
  label: string | null;
  count: number;
  percent: number;
};

export type CardPayChart = {
  items: CardPayChartItem[];
};

export type CardXyCell = {
  xLabel: string | null;
  yLabel: string | null;
  count: number;
  sharePct: number;
  momPct: number | null;
  momIsUp: boolean | null;
};

export type CardXyChart = {
  xLabels: Array<string | null>;
  yLabels: Array<string | null>;
  cells: CardXyCell[];
};

export type CardTrendPoint = {
  period: string;
  count: number;
};

export type CardTrendSeries = {
  label: string;
  points: CardTrendPoint[];
};

export type CardTrend = {
  series: CardTrendSeries[];
};
