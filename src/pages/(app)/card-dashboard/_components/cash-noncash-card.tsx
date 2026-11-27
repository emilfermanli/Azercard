import { useShellTheme } from '@/widgets/app-shell/shell-theme-context';
import { useAmountUnit } from '../_context/amount-unit-context';
import type { DonutDatum, Metric } from '../_types';
import {
  formatMetricExactValue,
  formatMetricValue,
  formatPct,
  mutedText,
  subtlePanelClass,
} from '../_utils';
import { ChartCard } from './chart-card';

type CashNonCashCardProps = {
  title: string;
  subtitle: string;
  data: DonutDatum[];
  metric: Metric;
};

function sharedTileValueSizeClass(values: string[]): string {
  const maxLen = Math.max(0, ...values.map((v) => v.length));
  if (maxLen <= 14) return 'text-2xl';
  if (maxLen <= 18) return 'text-xl';
  if (maxLen <= 21) return 'text-lg';
  return 'text-base';
}

/**
 * Cash / Non-cash — iki yan-yana göstərici plitəsi (dizayndakı kimi, pie deyil).
 */
export function CashNonCashCard({
  title,
  subtitle,
  data,
  metric,
}: CashNonCashCardProps) {
  const isDark = useShellTheme();
  const { unit } = useAmountUnit();

  const showTotal =
    data.length > 0 && (metric === 'amount' || metric === 'count');
  const totalRaw = showTotal
    ? data.reduce((sum, item) => sum + item.value, 0)
    : 0;
  const totalFormatted = showTotal
    ? formatMetricValue(totalRaw, metric, unit)
    : null;
  const totalExact = showTotal
    ? formatMetricExactValue(totalRaw, metric)
    : undefined;

  const tiles = data.map((item) => ({
    ...item,
    displayValue: formatMetricValue(item.value, metric, unit),
    exactValue: formatMetricExactValue(item.value, metric),
  }));
  const valueSizeClass = sharedTileValueSizeClass(
    tiles.map((tile) => tile.displayValue)
  );

  const totalBadge = totalFormatted ? (
    <span
      title={totalExact}
      className={[
        'shrink-0 rounded-lg border px-2.5 py-1 text-xs font-semibold tabular-nums',
        subtlePanelClass(isDark),
      ].join(' ')}
    >
      Cəm: {totalFormatted}
    </span>
  ) : undefined;

  return (
    <ChartCard
      title={title}
      subtitle={subtitle}
      action={totalBadge}
      empty={data.length === 0}
    >
      <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
        {tiles.map((item) => (
          <div
            key={item.name}
            className={[
              'flex flex-col rounded-xl border p-4',
              subtlePanelClass(isDark),
            ].join(' ')}
          >
            <span className="flex items-center gap-2 text-sm font-semibold">
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              {item.name}
            </span>
            <div
              className="group/tile relative mt-3 w-fit"
              title={item.exactValue}
            >
              <span className={['font-bold tabular-nums', valueSizeClass].join(' ')}>
                {item.displayValue}
              </span>
              <span className="pointer-events-none absolute left-0 top-full z-30 mt-1 hidden whitespace-nowrap rounded-md border border-slate-700 bg-slate-950 px-2.5 py-1 text-xs font-semibold text-white shadow-xl group-hover/tile:block">
                {item.exactValue}
              </span>
            </div>
            <span
              className={['mt-1 text-sm font-semibold', mutedText(isDark)].join(
                ' '
              )}
            >
              {formatPct(item.pct)}
            </span>
          </div>
        ))}
      </div>
    </ChartCard>
  );
}
