export type Metric = 'turnover' | 'count' | 'average';
export type AmountUnit = 'Min' | 'Mln' | 'Mlrd';

export type SelectOption = {
  label: string;
  value: string;
};

/** Sağ rəngli qurğu kartı. */
export type DeviceCard = {
  type: string;
  /** seçilmiş göstəricinin formatlanmış dəyəri. */
  value: string;
  /** pay (% — dövriyyəyə görə). */
  share: string;
  tone: string;
  color: string;
  active: boolean;
};

export type PieDatum = {
  name: string;
  value: number;
  color: string;
};

export type BarDatum = {
  label: string;
  value: number;
  color: string;
};

export type TrendDatum = {
  label: string;
  actual: number | null;
  forecast: number | null;
  lower: number | null;
  upper: number | null;
};
