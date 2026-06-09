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

/**
 * Bütün cards endpoint-lərində paylaşılan filtr parametrləri (API PascalCase).
 * Çox seçimli → massiv; boş massiv = filtr yoxdur.
 */
export type CardApiFilters = {
  BankNames?: string[];
  RegionNames?: string[];
  PaymentSchemes?: string[];
  ProductTypes?: string[];
  ContactlessStatuses?: string[];
  ExpStatuses?: string[];
  BaseCurrencies?: string[];
  CardProductNames?: string[];
};

/** Tarix aralığı (ayın 1-i, "YYYY-MM-01T00:00:00"). */
export type CardRangeArgs = CardApiFilters & {
  FromMonth: string;
  ToMonth: string;
};

/** top-cards — seçilmiş ölçü (dimension) üzrə kart bölgüsü. */
export type CardTopCardsArgs = CardRangeArgs & { dimension?: CardDimension };
export type CardPayChartArgs = CardRangeArgs & { Dimension: CardDimension };
export type CardXyChartArgs = CardRangeArgs & {
  XDimension: CardDimension;
  YDimension: CardDimension;
};
export type CardTrendArgs = CardRangeArgs & {
  Dimension: CardDimension;
  DimValues: string[];
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

/**
 * top-cards massiv qaytarır: seçilmiş ölçünün hər dəyəri üzrə kart sayı və pay.
 * `paymentScheme` sahəsi ölçüdən asılı olmayaraq dəyər etiketini saxlayır.
 */
export type CardTopCardItem = {
  paymentScheme: string;
  totalCards: number;
  sharePercent: number;
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
