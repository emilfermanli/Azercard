// TransactionDetailed ("Kart əməliyyat detalları") API tipləri — /api/TransactionDetailed/*
// Mənbə: real cavablar + "Transaction detailed" prototip decki.

/** MeasureType enum — faiz hansı göstərici üzrə hesablanır. */
export type MeasureType = 0 | 1 | 2 | 3; // 0 = məbləğ %, 1 = say %

/** Bütün TransactionDetailed endpointlərinin paylaşdığı parametrlər (tək dəyər). */
export type TransactionDetailedArgs = {
  DateFrom?: string;
  DateTo?: string;
  CardType?: string;
  Currency?: string;
  SourceBankName?: string;
  PaymentSystem?: string;
  OperationType?: string;
  TransGroup?: string;
  TokenStatus?: string;
  AcquiringDevice?: string;
  IssuingCategory?: string;
  TargetBankName?: string;
  Measure?: MeasureType;
};

/** Bölgü sətri (məbləğ + say + pay). */
export type TdBreakdownRow = {
  amount: number;
  count: number;
  percent: number;
  changePercent: number;
};

export type TdBankRow = TdBreakdownRow & { bankName: string };
export type TdDeviceRow = TdBreakdownRow & { deviceType: string };
export type TdIssuingRow = TdBreakdownRow & { label: string };

export type TdKpi = {
  totalAmount: number;
  totalCount: number;
  changePercent: number;
};

export type TdSummary = {
  kpi: TdKpi;
  issuingCategories: TdIssuingRow[];
  targetBanks: TdBankRow[];
  acquiringDevices: TdDeviceRow[];
};
