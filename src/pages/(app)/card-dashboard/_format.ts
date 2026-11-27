import {
  buildCountAxisTicks,
  buildUnitAxisTicks,
  formatAmount,
  formatCount,
  formatCountByUnit,
  formatExactAmount,
  getUnitSuffix,
  type AmountUnit,
  type FormatAmountOptions,
} from '@/utils/amount-unit';
import type { Metric } from './_types';

export {
  AMOUNT_UNIT_CONFIG,
  AMOUNT_UNIT_OPTIONS,
  APP_LOCALE,
  buildCountAxisTicks,
  buildUnitAxisTicks,
  formatAmount,
  formatCount,
  formatCountByUnit,
  formatExactAmount,
  formatPct,
  getUnitDivisor,
  getUnitSuffix,
  isAmountUnit,
  type AmountUnit,
  type AmountUnitConfig,
  type FormatAmountOptions,
} from '@/utils/amount-unit';

/** Seçilmiş KPI göstəricisinə (`amount` / `count` / `avg`) görə vahidli dəyəri formatlayır. */
export function formatMetricValue(
  value: number | null | undefined,
  metric: Metric,
  unit: AmountUnit,
  options?: FormatAmountOptions
): string {
  if (metric === 'count') {
    return formatCountByUnit(value, unit, options);
  }
  const effectiveUnit = metric === 'avg' ? 'tam' : unit;
  return formatAmount(value, effectiveUnit, options);
}

/** Tooltip və `title` atributu üçün göstəricinin tam (bölünməmiş) dəyərini formatlayır. */
export function formatMetricExactValue(
  value: number | null | undefined,
  metric: Metric
): string {
  return metric === 'count' ? formatCount(value) : formatExactAmount(value);
}

/** Qrafik altbaşlığı üçün seçilmiş göstərici və vahidə uyğun ölçü etiketi. */
export function getMetricUnitTag(metric: Metric, unit: AmountUnit): string {
  if (metric === 'avg') return ' (₼)';
  const suffix = getUnitSuffix(unit);
  if (metric === 'count') {
    return suffix ? ` (${suffix})` : '';
  }
  return suffix ? ` (${suffix} ₼)` : ' (₼)';
}

/** Aktiv göstəriciyə (`amount` / `count` / `avg`) və vahidə uyğun qrafik ox tick-ləri. */
export function buildMetricAxisTicks(
  maxRaw: number,
  metric: Metric,
  unit: AmountUnit,
  maxTicks = 5
): number[] | undefined {
  if (metric === 'avg') return buildUnitAxisTicks(maxRaw, 'tam', maxTicks);
  if (metric === 'count') {
    return unit === 'tam'
      ? buildCountAxisTicks(maxRaw, maxTicks)
      : buildUnitAxisTicks(maxRaw, unit, maxTicks);
  }
  return buildUnitAxisTicks(maxRaw, unit, maxTicks);
}
