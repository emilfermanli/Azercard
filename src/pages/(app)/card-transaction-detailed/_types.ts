export type Measure = 'amount' | 'count';

export type ColumnKey = 'bank' | 'device' | 'issuing' | 'targetBank';

export type SelectOption = {
  label: string;
  value: string;
};

/** Bölgü sütununda bir sətir. */
export type ColumnRow = {
  /** filtr dəyəri (API-yə göndərilən xam dəyər). */
  value: string;
  /** ekranda görünən ad. */
  label: string;
  amount: number;
  count: number;
  percent: number;
  /** keçən dövrlə müqayisədə dəyişmə (%). */
  changePercent: number;
  selected: boolean;
};

/** Aktiv seçim çipi. */
export type SelectionChip = {
  key: ColumnKey;
  columnTitle: string;
  label: string;
};
