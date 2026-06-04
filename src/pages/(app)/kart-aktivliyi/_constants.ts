import { CreditCard, Globe2, Landmark, MapPinned } from 'lucide-react';

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
  'Yan', 'Fev', 'Mar', 'Apr', 'May', 'İyn',
  'İyl', 'Avq', 'Sen', 'Okt', 'Noy', 'Dek',
];

// xy-analysis default ölçüləri.
export const XY_DEFAULT_X_DIMENSION: DeviceDimension = 'retail_category';
export const XY_DEFAULT_Y_DIMENSION: DeviceDimension = 'region_name';

// Statik tablar — backend qarşılığı yoxdur (period/dimension).
export const PERIOD_TABS = ['Ay', 'İl'];
export const DIMENSION_TABS: DimensionTab[] = [
  { label: 'Kart', icon: CreditCard },
  { label: 'ÖS', icon: Landmark },
  { label: 'AZC', icon: MapPinned },
  { label: 'Bank', icon: Landmark },
  { label: 'Region', icon: Globe2 },
];
