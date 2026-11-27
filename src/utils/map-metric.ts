import {
  formatAmount,
  formatCount,
  formatCountByUnit,
  formatExactAmount,
  type AmountUnit,
} from '@/utils/amount-unit';

export type MapMetric = 'turnover' | 'count' | 'average';

/**
 * Xəritə səhifələrində (`azmap`, `worldmap`) göstərici dəyərini vahidə görə formatlayır:
 * - `count`: vahidə bölünür (₼ simvolu olmadan)
 * - `average`: hər əməliyyat üçün orta AZN məbləğidir, vahidə bölünmür (`tam`)
 * - `turnover`: vahidə bölünür (`₼` ilə)
 */
export function formatMapMetricValue(
  value: number | null | undefined,
  metric: MapMetric,
  unit: AmountUnit
): string {
  if (metric === 'count') return formatCountByUnit(value, unit);
  if (metric === 'average') return formatAmount(value, 'tam');
  return formatAmount(value, unit);
}

/** Xəritə tooltip və `title` atributları üçün tam (bölünməmiş) dəyər. */
export function formatMapMetricExact(
  value: number | null | undefined,
  metric: MapMetric
): string {
  return metric === 'count' ? formatCount(value) : formatExactAmount(value);
}
