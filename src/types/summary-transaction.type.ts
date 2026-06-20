// SummaryTransaction ("Summary transaction") API tipləri — /api/SummaryTransaction/*
// Mənbə: real cavab (Swagger response sxemi boşdur) + "Summary transaction.pptx" deck.

/** Məbləğ miqyası (AmountScale enum) — server amount-u bu ədədə bölür. */
export type AmountScale = 1 | 1000000 | 1000000000; // 1 = manat, 1e6 = mln, 1e9 = mlrd

/** Bütün sorğunun parametrləri (hamısı optional, tək dəyər). */
export type SummaryTransactionArgs = {
  DateFrom?: string;
  DateTo?: string;
  TargetBankName?: string;
  SourceBankName?: string;
  CardProductType?: string;
  PaymentSystem?: string;
  TransGroup?: string;
  OperationType?: string;
  TokenStatus?: string;
  IsContactless?: string;
  TransactionCurrency?: string;
  Scale?: AmountScale;
};

/** ACQUIRING_DEVICE_TYPE üzrə bir sətir. */
export type SummaryDeviceRow = {
  deviceType: string; // POS | ATM | ECO | C2C | UFX
  amount: number;
  count: number;
};

/** Bir qrup (total / issuing / inner / acquiring) — cəmi + qurğu bölgüsü. */
export type SummaryGroup = {
  amount: number;
  count: number;
  devices: SummaryDeviceRow[];
};

/** /SummaryTransaction/summary cavabı. */
export type SummaryTransactionResponse = {
  total: SummaryGroup;
  issuing: SummaryGroup;
  inner: SummaryGroup;
  acquiring: SummaryGroup;
};
