export type Metric = 'amount' | 'count' | 'avg';

/** Bölgü qrafiklərinin göstərmə rejimi (% və ya mütləq rəqəm). */
export type DisplayMode = 'pct' | 'number';

export type SelectOption = {
  label: string;
  value: string;
};

export type KpiCard = {
  key: Metric;
  label: string;
  /** Xam AZN (monetar) və ya əməliyyat sayı (count) dəyəri — formatlama render anında aparılır. */
  rawValue: number | null;
  active: boolean;
  monetary: boolean;
};

export type DonutDatum = {
  name: string;
  /** Aktiv göstərici üzrə xam dəyər (AZN və ya əməliyyat sayı). */
  value: number;
  /** faiz payı. */
  pct: number;
  color: string;
};

export type TrendDatum = {
  label: string;
  actual: number | null;
  forecast: number | null;
  low: number | null;
  high: number | null;
  changePct: number | null;
};

export type AlertItem = {
  label: string;
  changePct: number;
};
