import type { LucideIcon } from 'lucide-react';

export type Trend = 'up' | 'down' | 'flat';

export type SelectOption = {
  label: string;
  value: string;
};

export type SummaryCard = {
  label: string;
  value: string;
  share: string;
  trend: Trend;
  tone: string;
  details: string[];
};

export type MatrixCell = {
  amount: number;
  trend: Trend;
};

export type DisplayRow = {
  name: string;
  values: MatrixCell[];
};

export type PieDatum = {
  name: string;
  value: number;
  color: string;
};

export type TrendDatum = {
  label: string;
  total: number;
};

export type RightPanelMode = 'share' | 'trend';

export type DimensionTab = {
  label: string;
  icon: LucideIcon;
};
