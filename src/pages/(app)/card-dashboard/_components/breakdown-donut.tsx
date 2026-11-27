import { useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

import { useShellTheme } from '@/widgets/app-shell/shell-theme-context';
import { useAmountUnit } from '../_context/amount-unit-context';
import type { DisplayMode, DonutDatum, Metric } from '../_types';
import {
  formatMetricExactValue,
  formatMetricValue,
  formatPct,
  mutedText,
  type AmountUnit,
} from '../_utils';
import { ChartCard } from './chart-card';

type BreakdownDonutProps = {
  title: string;
  subtitle: string;
  data: DonutDatum[];
  metric: Metric;
};

function DonutTooltip({
  active,
  payload,
  mode,
  metric,
  unit,
}: {
  active?: boolean;
  payload?: Array<{ payload?: DonutDatum }>;
  mode: DisplayMode;
  metric: Metric;
  unit: AmountUnit;
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  if (!item) return null;

  const formattedValue = formatMetricValue(item.value, metric, unit);
  const exactValue = formatMetricExactValue(item.value, metric);

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white shadow-xl">
      <p className="font-semibold">{item.name}</p>
      <p className="mt-1 tabular-nums">
        {mode === 'pct'
          ? `${formatPct(item.pct)} (${formattedValue})`
          : `${formattedValue} (${formatPct(item.pct)})`}
      </p>
      {exactValue && exactValue !== formattedValue && (
        <p className="mt-0.5 text-[11px] text-slate-300 tabular-nums">
          Tam: {exactValue}
        </p>
      )}
    </div>
  );
}

/** Bölgü qrafiki (6,7,8,9) — donut + yuxarıda % / Number seçimi. */
export function BreakdownDonut({
  title,
  subtitle,
  data,
  metric,
}: BreakdownDonutProps) {
  const isDark = useShellTheme();
  const { unit } = useAmountUnit();
  const [mode, setMode] = useState<DisplayMode>('pct');

  const showTotal =
    mode === 'number' &&
    data.length > 0 &&
    (metric === 'amount' || metric === 'count');
  const totalRaw = showTotal
    ? data.reduce((sum, item) => sum + item.value, 0)
    : 0;
  const formattedTotal = showTotal
    ? formatMetricValue(totalRaw, metric, unit)
    : null;
  const exactTotal = showTotal
    ? formatMetricExactValue(totalRaw, metric)
    : undefined;

  const toggle = (
    <div className="inline-flex rounded-lg border border-blue-500/30 p-0.5">
      {(['pct', 'number'] as DisplayMode[]).map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => setMode(value)}
          className={[
            'h-7 rounded-md px-2.5 text-xs font-semibold transition',
            mode === value
              ? 'bg-blue-600 text-white'
              : isDark
                ? 'text-slate-300 hover:bg-slate-800'
                : 'text-slate-600 hover:bg-slate-100',
          ].join(' ')}
        >
          {value === 'pct' ? '%' : 'Number'}
        </button>
      ))}
    </div>
  );

  return (
    <ChartCard
      title={title}
      subtitle={subtitle}
      action={toggle}
      empty={data.length === 0}
    >
      <div className="flex flex-col items-center gap-4 sm:flex-row">
        <div className="h-44 w-44 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip
                content={
                  <DonutTooltip mode={mode} metric={metric} unit={unit} />
                }
              />
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius="58%"
                outerRadius="88%"
                paddingAngle={2}
                stroke="transparent"
              >
                {data.map((item) => (
                  <Cell key={item.name} fill={item.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="min-w-0 flex-1">
          <ul className="space-y-1.5">
            {data.map((item) => {
              const formattedValue = formatMetricValue(
                item.value,
                metric,
                unit
              );
              const exactValue = formatMetricExactValue(item.value, metric);

              return (
                <li
                  key={item.name}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <span className="flex min-w-0 items-center gap-2 font-medium">
                    <span
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="truncate" title={item.name}>
                      {item.name}
                    </span>
                  </span>
                  <span
                    title={mode === 'number' ? exactValue : undefined}
                    className={[
                      'shrink-0 tabular-nums font-semibold',
                      mutedText(isDark),
                    ].join(' ')}
                  >
                    {mode === 'pct' ? formatPct(item.pct) : formattedValue}
                  </span>
                </li>
              );
            })}
          </ul>
          {formattedTotal && (
            <div
              className={[
                'mt-2 flex items-center justify-between border-t pt-2 text-xs font-semibold',
                isDark ? 'border-slate-800' : 'border-slate-200',
                mutedText(isDark),
              ].join(' ')}
            >
              <span>Cəm</span>
              <span title={exactTotal} className="tabular-nums">
                {formattedTotal}
              </span>
            </div>
          )}
        </div>
      </div>
    </ChartCard>
  );
}
