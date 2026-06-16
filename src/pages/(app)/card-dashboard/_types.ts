export type Metric = 'amount' | 'count' | 'avg' | 'max';

/** Bölgü qrafiklərinin göstərmə rejimi (% və ya mütləq rəqəm). */
export type DisplayMode = 'pct' | 'number';

export type SelectOption = {
  label: string;
  value: string;
};

export type KpiCard = {
  key: Metric;
  label: string;
  value: string;
  active: boolean;
  monetary: boolean;
};

export type DonutDatum = {
  name: string;
  /** donut bölmə ölçüsü (aktiv göstərici üzrə mütləq dəyər). */
  value: number;
  /** faiz payı. */
  pct: number;
  /** formatlanmış mütləq dəyər (etiket üçün). */
  valueLabel: string;
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
