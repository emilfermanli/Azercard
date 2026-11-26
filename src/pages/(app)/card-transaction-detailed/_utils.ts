import {
  AMOUNT_UNIT_CONFIG,
  AMOUNT_UNIT_OPTIONS,
  formatAmount as formatUnitAmount,
  formatCount,
  formatExactAmount,
  formatPct as formatUnitPct,
  isAmountUnit,
  type AmountUnit,
} from '../card-dashboard/_format';
import type { Measure } from './_types';

export {
  AMOUNT_UNIT_CONFIG,
  AMOUNT_UNIT_OPTIONS,
  formatCount,
  formatExactAmount,
  formatUnitAmount as formatAmount,
  isAmountUnit,
  type AmountUnit,
};

/** null/boş label-ı oxunaqlı mətnə çevirir. */
export function labelText(label: string | null | undefined): string {
  const text = label?.trim();
  return text ? text : 'Naməlum';
}

/** Tam say formatı (vahiddən asılı deyil). */
export function formatInt(value: number | null | undefined): string {
  return formatCount(value);
}

export function formatPct(value: number | null | undefined): string {
  return formatUnitPct(value);
}

/** Sətirin seçilmiş göstərici üzrə mütləq dəyəri. */
export function rowValue(
  row: { amount: number; count: number },
  measure: Measure
): number {
  return measure === 'count' ? row.count : row.amount;
}

/** Göstərici və seçilmiş məbləğ vahidi üzrə dəyər — say (tam) / məbləğ (Tam/Min/Mln/Mlrd). */
export function measureValue(
  row: { amount: number | null | undefined; count: number | null | undefined },
  measure: Measure,
  unit: AmountUnit = 'mln'
): string {
  return measure === 'count'
    ? formatCount(row.count)
    : formatUnitAmount(row.amount, unit);
}

/** Tooltip (title) üçün tam dəqiq dəyər — say / xam AZN məbləği. */
export function exactMeasureValue(
  row: { amount: number | null | undefined; count: number | null | undefined },
  measure: Measure
): string {
  return measure === 'count'
    ? formatCount(row.count)
    : formatExactAmount(row.amount);
}

/** İşarəli faiz (dəyişmə) — "+12,3%" / "-4%". */
export const signedPct = (value: number): string =>
  `${value > 0 ? '+' : ''}${value.toLocaleString('az-AZ', { maximumFractionDigits: 1 })}%`;

// --- Tema class tokenləri (light/dark) ---

export const panelClass = (isDark: boolean): string =>
  isDark
    ? 'border-slate-800 bg-slate-900/70 text-slate-100 shadow-black/20'
    : 'border-slate-200 bg-white text-slate-950 shadow-slate-200/70';

export const subtlePanelClass = (isDark: boolean): string =>
  isDark ? 'border-slate-800 bg-slate-950/45' : 'border-slate-200 bg-slate-50';

export const mutedText = (isDark: boolean): string =>
  isDark ? 'text-slate-300' : 'text-slate-500';
