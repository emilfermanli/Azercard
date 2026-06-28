import { AMOUNT_UNITS, MONTHS_AZ } from './_constants';
import type { AmountUnit, Metric } from './_types';

/** null/boş label-ı oxunaqlı mətnə çevirir. */
export function labelText(label: string | null | undefined): string {
  const text = label?.trim();
  return text ? text : 'Naməlum';
}

/** API ISO tarixini ("...T00:00:00") date input dəyərinə çevirir ("YYYY-MM-DD"). */
export function toDateInput(iso: string | undefined): string {
  return iso ? iso.slice(0, 10) : '';
}

/** Date input dəyərini ("YYYY-MM-DD") API formatına çevirir ("...T00:00:00"). */
export function toApiDate(dateInput: string): string {
  return `${dateInput}T00:00:00`;
}

/** {value, count} olan qrafik elementindən seçilmiş göstəricini çıxarır. */
export function pickMetric(
  item: { value: number; count: number },
  metric: Metric
): number {
  if (metric === 'count') return item.count;
  if (metric === 'average') return item.count ? item.value / item.count : 0;
  return item.value;
}

/** Qurğu kartı (deviceSummary) üçün göstərici. */
export function pickDeviceMetric(
  item: { volume: number; count: number; avgAmount: number },
  metric: Metric
): number {
  if (metric === 'count') return item.count;
  if (metric === 'average') return item.avgAmount;
  return item.volume;
}

const amountDivisor = (unit: AmountUnit): number =>
  AMOUNT_UNITS.find((u) => u.value === unit)?.divisor ?? 1;

/** Göstəricini kateqoriya/məbləğ vahidinə uyğun formatlayır. */
export function formatMetric(value: number, metric: Metric, unit: AmountUnit): string {
  if (metric === 'count') {
    return Math.round(value).toLocaleString('az-AZ');
  }
  const scaled = value / amountDivisor(unit);
  return scaled.toLocaleString('az-AZ', { maximumFractionDigits: 2 });
}

/** Monetar göstəricini qrafik oxu üçün vahidə bölür (count olduğu kimi qalır). */
export function scaleForAxis(value: number, metric: Metric, unit: AmountUnit): number {
  if (metric === 'count') return value;
  return value / amountDivisor(unit);
}

/** Qrafik oxu üçün qısa (kompakt) etiket — vahidə bölünmüş. */
export function formatAxisTick(value: number, metric: Metric, unit: AmountUnit): string {
  const scaled = scaleForAxis(value, metric, unit);
  return new Intl.NumberFormat('az-AZ', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(scaled);
}

/** Trend nöqtəsinin period dəyərini qranulyarlığa görə qısa etiketə çevirir. */
export function periodLabel(iso: string, granularity: string): string {
  const year = iso.slice(0, 4);
  const monthIndex = Number(iso.slice(5, 7)) - 1;
  const day = iso.slice(8, 10);
  switch (granularity) {
    case 'Year':
      return year;
    case 'Quarter':
      return `${year} R${Math.floor(monthIndex / 3) + 1}`;
    case 'Day':
      return `${day} ${MONTHS_AZ[monthIndex] ?? ''}`;
    default:
      return `${MONTHS_AZ[monthIndex] ?? ''} ${iso.slice(2, 4)}`;
  }
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
