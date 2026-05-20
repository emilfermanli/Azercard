export interface MarketBenchmarkItem {
  reportMonth: string;
  bankName: string | null;
  regionNameClean: string | null;
  cardBrandName: string | null;
  productType: string | null;
  bankTransAmount: number;
  bankTransCount: number;
  bankCardCount: number;
  marketTotalAmount: number;
  marketTotalCards: number;
  marketSharePct: number;
  cardSharePct: number;
  bankRank: number;
}

export interface MarketBenchmarkPaginatedResponse {
  items: MarketBenchmarkItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface MarketBenchmarkRankedParams {
  month: string | Date;
  Page?: number;
  PageSize?: number;
  regionNameClean: string;
}

export interface MarketBenchmarkFilterParams {
  ReportMonth?: string | Date;
  BankName?: string;
  RegionNameClean?: string;
  CardBrandName?: string;
  ProductType?: string;
  BankTransAmount?: number;
  BankTransCount?: number;
  BankCardCount?: number;
  MarketTotalAmount?: number;
  MarketTotalCards?: number;
  MarketSharePct?: number;
  CardSharePct?: number;
  BankRank?: number;
  Page?: number;
  PageSize?: number;
}

export interface MarketBenchmarkBankTrendParams {
  bankName: string;
}

export interface MarketBenchmarkBankTrendItem {
  month: string;
  marketSharePct: number;
  cardSharePct: number;
}
