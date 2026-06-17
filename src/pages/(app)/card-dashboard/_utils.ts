import { ROUND_TO_OPTIONS } from './_constants';

/** null/boş label-ı oxunaqlı mətnə çevirir. */
export function labelText(label: string | null | undefined): string {
  const text = label?.trim();
  return text ? text : 'Naməlum';
}

/** Rəqəmi Azərbaycan formatında göstərir (məs: 11 125,4). */
export function formatNumber(value: number, fractionDigits = 2): string {
  return value.toLocaleString('az-AZ', { maximumFractionDigits: fractionDigits });
}

/** Tam (integer) rəqəm formatı — əməliyyat sayı üçün. */
export function formatInt(value: number): string {
  return Math.round(value).toLocaleString('az-AZ');
}

/** RoundTo dəyərinə uyğun vahid sonluğu ("mln", "mlrd" və s.). */
export function roundSuffix(roundTo: number): string {
  return ROUND_TO_OPTIONS.find((o) => o.value === roundTo)?.suffix ?? '';
}

/**
 * Göstəricini formatlayır: monetar → vahid sonluğu ilə, say → tam rəqəm.
 * Dəyərlər server tərəfdə artıq RoundTo-ya görə yuvarlaqlaşdırılıb.
 */
export function formatMetricValue(
  value: number,
  monetary: boolean,
  roundTo: number
): string {
  if (!monetary) return formatInt(value);
  const suffix = roundSuffix(roundTo);
  return suffix ? `${formatNumber(value)} ${suffix}` : formatNumber(value);
}

/**
 * Qısa (kompakt) format — böyük rəqəmləri "1,44 mlrd", "236,33 mln" kimi yazır.
 * az-AZ lokalı kompakt notasiyada "min / mln / mlrd" işlədir.
 */
export function formatCompact(value: number, monetary: boolean): string {
  const short = new Intl.NumberFormat('az-AZ', {
    notation: 'compact',
    maximumFractionDigits: 2,
  }).format(value);
  return monetary ? `${short} ₼` : short;
}

/** Faiz formatı. */
export function formatPct(value: number): string {
  return `${value.toLocaleString('az-AZ', { maximumFractionDigits: 1 })}%`;
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
