import { CreditCard, Globe2, Landmark, Tags } from 'lucide-react';

import type { DeviceDimension } from '@/types/devices.type';
import type { DimensionTab, RightPanelMode } from './_types';

// Cədvəl/qrafik splitter ölçüləri (px).
export const DEFAULT_CHART_WIDTH = 380;
export const MIN_CHART_WIDTH = 300;
export const STACK_CHART_WIDTH = 260;
export const MIN_TABLE_WIDTH = 520;
export const SPLITTER_SPACE = 28;

// Kart fonu və donut rəng palitraları (kateqoriya sayı dəyişkən olduğu üçün dövr edir).
export const CARD_TONES = [
  'from-sky-500 to-cyan-500',
  'from-violet-600 to-fuchsia-600',
  'from-emerald-500 to-green-600',
  'from-amber-300 to-yellow-400',
  'from-rose-500 to-pink-600',
];
export const PIE_COLORS = ['#38bdf8', '#22c55e', '#f59e0b', '#a855f7', '#ef4444'];

// Sağ panel rejimləri (Pay = donut, Trend = xətti qrafik).
export const RIGHT_PANEL_MODES: Array<{ value: RightPanelMode; label: string }> = [
  { value: 'share', label: 'Pay' },
  { value: 'trend', label: 'Trend' },
];

// Trend qrafiki üçün ay sayı və ay adları.
export const TREND_MONTH_COUNT = 6;
export const MONTHS_AZ = [
  'Yan',
  'Fev',
  'Mar',
  'Apr',
  'May',
  'İyn',
  'İyl',
  'Avq',
  'Sen',
  'Okt',
  'Noy',
  'Dek',
];

// xy-analysis default ölçüləri.
export const XY_DEFAULT_X_DIMENSION: DeviceDimension = 'retail_category';
export const XY_DEFAULT_Y_DIMENSION: DeviceDimension = 'region_name';

// Matrisin sətir ölçüsünü (yDimension) seçən tablar.
export const DIMENSION_TABS: DimensionTab[] = [
  { label: 'Bank', value: 'bank_name', icon: Landmark },
  { label: 'Region', value: 'region_name', icon: Globe2 },
  { label: 'Mcc', value: 'mcc_name', icon: Tags },
  { label: 'Terminal', value: 'retail_category', icon: CreditCard },
];

// "Bölgü" (share dimension) seçimləri.
// UI dəyəri camelCase, API isə snake_case `dimension` gözləyir → SHARE_DIMENSION_API.
export type ShareDimensionValue =
  | 'bankName'
  | 'regionName'
  | 'mccName'
  | 'retailCategory';

export const SHARE_DIMENSION_OPTIONS: Array<{
  label: string;
  value: ShareDimensionValue;
}> = [
  { label: 'Bank', value: 'bankName' },
  { label: 'Region', value: 'regionName' },
  { label: 'Mcc', value: 'mccName' },
  { label: 'Terminal', value: 'retailCategory' },
];

export const SHARE_DIMENSION_API: Record<ShareDimensionValue, DeviceDimension> = {
  bankName: 'bank_name',
  regionName: 'region_name',
  mccName: 'mcc_name',
  retailCategory: 'retail_category',
};

export const SHARE_DIMENSION_DEFAULT: ShareDimensionValue = 'retailCategory';
