export {
  AMOUNT_UNIT_CONFIG,
  AMOUNT_UNIT_OPTIONS,
  APP_LOCALE,
  buildCountAxisTicks,
  buildMetricAxisTicks,
  buildUnitAxisTicks,
  formatAmount,
  formatCount,
  formatCountByUnit,
  formatExactAmount,
  formatMetricExactValue,
  formatMetricValue,
  formatPct,
  getMetricUnitTag,
  getUnitDivisor,
  getUnitSuffix,
  isAmountUnit,
  type AmountUnit,
  type AmountUnitConfig,
  type FormatAmountOptions,
} from './_format';

/** null/boş label-ı oxunaqlı mətnə çevirir. */
export function labelText(label: string | null | undefined): string {
  const text = label?.trim();
  return text ? text : 'Naməlum';
}

// --- Tema class tokenləri (light/dark) ---

export const panelClass = (isDark: boolean): string =>
  isDark
    ? 'border-slate-800 bg-slate-900/70 text-slate-100 shadow-black/20'
    : 'border-slate-200 bg-white text-slate-950 shadow-slate-200/70';

export const subtlePanelClass = (isDark: boolean): string =>
  isDark ? 'border-slate-800 bg-slate-950/45' : 'border-slate-200 bg-slate-50';

export const mutedText = (isDark: boolean): string =>
  isDark ? 'text-slate-300' : 'text-slate-500';
