import type { Trend } from './_types';

/** Rəqəmi Azərbaycan formatında göstərir (məs: 11 125). */
export function formatCount(value: number): string {
  return value.toLocaleString('az-AZ');
}

/** mom_diff dəyərini trend istiqamətinə çevirir. */
export function trendOf(diff: number | null | undefined): Trend {
  if (diff == null || diff === 0) return 'flat';
  return diff > 0 ? 'up' : 'down';
}

/** API ISO tarixini ("...T00:00:00") date input dəyərinə çevirir ("YYYY-MM-DD"). */
export function toDateInput(iso: string | undefined): string {
  return iso ? iso.slice(0, 10) : '';
}

/** Date input dəyərini ("YYYY-MM-DD") API formatına çevirir (ayın 1-i). */
export function toReportMonth(dateInput: string): string {
  const [year, month] = dateInput.split('-');
  return `${year}-${month}-01T00:00:00`;
}

/** Date input dəyərini ("YYYY-MM-DD") API DateTime formatına çevirir (gün qorunur). */
export function toDateTime(dateInput: string): string {
  return `${dateInput}T00:00:00`;
}

/** "YYYY-MM-01T00:00:00" tarixini `delta` ay sürüşdürür. */
export function shiftMonth(iso: string, delta: number): string {
  const date = new Date(iso);
  const shifted = new Date(Date.UTC(date.getFullYear(), date.getMonth() + delta, 1));
  const year = shifted.getUTCFullYear();
  const month = String(shifted.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}-01T00:00:00`;
}

/** Trend istiqamətinə görə mətn rəngi. */
export function trendClasses(trend: Trend): string {
  if (trend === 'up') return 'text-emerald-400';
  if (trend === 'down') return 'text-red-400';
  return 'text-slate-400';
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
