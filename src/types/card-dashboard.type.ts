// CardDashboard ("Card transaction Summary") API tipləri — /api/CardDashboard/*
// Mənbə: real cavablar (Swagger response sxemləri boşdur) + Prototip deck.

/** DateGrouping enum — trend zaman addımı. */
export type DateGrouping = 0 | 1 | 2; // 0 = ay, 1 = rüb, 2 = il

/** RoundTo enum — məbləğ yuvarlaqlaşdırma (server tərəfdə tətbiq olunur). */
export type RoundTo = 0 | 1 | 2 | 3; // 0 = tam, 1 = min, 2 = mln, 3 = mlrd

/** Bütün dashboard sorğusunun parametrləri (hamısı optional, tək dəyər). */
export type CardDashboardArgs = {
  DateFrom?: string;
  DateTo?: string;
  DateGrouping?: DateGrouping;
  RoundTo?: RoundTo;
  TargetBankName?: string;
  TransGroup?: string;
  CardTypeCategory?: string;
  PaymentSystem?: string;
  PaymentType?: string;
  OperationType?: string;
  TokenStatus?: string;
  IsContactless?: boolean;
};

// --- Cavablar ---

export type CardDashboardFilters = {
  paymentSystems: string[];
  paymentTypes: string[];
  operationTypes: string[];
  cardTypeCategories: string[];
  tokenStatuses: string[];
  transGroups: string[];
  targetBankNames: string[];
};

/** Yuxarı 4 KPI pəncərəsi. */
export type CardKpi = {
  totalAmount: number;
  totalTxCount: number;
  avgAmount: number;
  maxAmount: number;
};

/** Trend (5-ci qrafik) nöqtəsi — faktiki + əvvəlki dövr + proqnoz sahələri. */
export type CardTrendPoint = {
  periodDate: string;
  periodLabel: string;
  totalAmount: number;
  totalTxCount: number;
  prevAmount: number | null;
  prevTxCount: number | null;
  amountChangePct: number | null;
  txChangePct: number | null;
  isForecast: boolean;
  forecastAmount: number | null;
  forecastAmountLow: number | null;
  forecastAmountHigh: number | null;
  forecastTxCount: number | null;
  forecastTxCountLow: number | null;
  forecastTxCountHigh: number | null;
  forecastAccuracy: number | null;
};

/** Bölgü (6,7,8,9 qrafikləri) elementi. */
export type CardBreakdownItem = {
  category: string;
  totalAmount: number;
  totalTxCount: number;
  amountPct: number;
  txCountPct: number;
};

export type CardBreakdown = {
  groupBy: string;
  items: CardBreakdownItem[];
};

export type CardDashboardResponse = {
  kpi: CardKpi;
  trend: CardTrendPoint[];
  productBreakdown: CardBreakdown;
  paymentSystem: CardBreakdown;
  paymentType: CardBreakdown;
  cashNonCash: CardBreakdown;
};
