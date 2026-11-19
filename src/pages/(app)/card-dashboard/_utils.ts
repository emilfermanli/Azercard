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

/** Qısa (kompakt) ədəd formatı — K/M/G əvəzinə "min / mln / mlrd" işlədir. */
export function formatCompactNumber(value: number, fractionDigits = 1): string {
  const num = Number(value ?? 0);
  const abs = Math.abs(num);
  if (abs >= 1_000_000_000) {
    return `${formatNumber(num / 1_000_000_000, fractionDigits)} mlrd`;
  }
  if (abs >= 1_000_000) {
    return `${formatNumber(num / 1_000_000, fractionDigits)} mln`;
  }
  if (abs >= 1_000) {
    return `${formatNumber(num / 1_000, fractionDigits)} min`;
  }
  return formatNumber(num, fractionDigits);
}

/**
 * Göstəricini formatlayır: monetar → vahid sonluğu və ₼ ilə, say → tam rəqəm.
 * Dəyərlər server tərəfdə artıq RoundTo-ya görə yuvarlaqlaşdırılıb.
 */
export function formatMetricValue(
  value: number,
  monetary: boolean,
  roundTo: number
): string {
  if (!monetary) return formatInt(value);
  const suffix = roundSuffix(roundTo);
  return suffix ? `${formatNumber(value)} ${suffix} ₼` : `${formatNumber(value)} ₼`;
}

/**
 * KPI kartları üçün qısa format:
 * - Say (monetary=false): "314,43 min", "1,2 mln" və s.
 * - Monetar + RoundTo > 0 (Min/Mln/Mlrd): server artıq həmin vahidə böldüyü üçün
 *   təkrar 1000-ə bölmədən seçilmiş vahidlə göstərir ("54 200 min ₼", "54,2 mln ₼").
 * - Monetar + RoundTo === 0 (Tam): "54,2 mln ₼", "1,44 mlrd ₼" kimi kompakt Azərbaycan vahidi ilə göstərir.
 */
export function formatCompact(value: number, monetary: boolean, roundTo = 0): string {
  if (!monetary) {
    const num = Number(value ?? 0);
    return Math.abs(num) >= 1_000 ? formatCompactNumber(num, 2) : formatInt(num);
  }
  const suffix = roundSuffix(roundTo);
  if (suffix) {
    return `${formatNumber(value, 2)} ${suffix} ₼`;
  }
  return `${formatCompactNumber(value, 2)} ₼`;
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
