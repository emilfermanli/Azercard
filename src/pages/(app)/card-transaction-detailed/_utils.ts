import type { Measure } from './_types';

/** null/boş label-ı oxunaqlı mətnə çevirir. */
export function labelText(label: string | null | undefined): string {
  const text = label?.trim();
  return text ? text : 'Naməlum';
}

/** Məbləğ formatı (az-AZ, 2 onluq). */
export function formatAmount(value: number): string {
  return value.toLocaleString('az-AZ', { maximumFractionDigits: 2 });
}

/** Tam say formatı. */
export function formatInt(value: number): string {
  return Math.round(value).toLocaleString('az-AZ');
}

export function formatPct(value: number): string {
  return `${value.toLocaleString('az-AZ', { maximumFractionDigits: 1 })}%`;
}

/** Sətirin seçilmiş göstərici üzrə mütləq dəyəri. */
export function rowValue(
  row: { amount: number; count: number },
  measure: Measure
): number {
  return measure === 'count' ? row.count : row.amount;
}

/** Göstərici üzrə dəqiq, tam dəyər (yuvarlaqlaşdırma yoxdur) — say / məbləğ. */
export function measureValue(
  row: { amount: number; count: number },
  measure: Measure
): string {
  return measure === 'count' ? formatInt(row.count) : `${formatAmount(row.amount)} ₼`;
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
