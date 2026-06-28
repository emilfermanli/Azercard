import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { useShellTheme } from '@/widgets/app-shell/shell-theme-context';
import type { AmountUnit, Metric, TrendDatum } from '../_types';
import { formatAxisTick, formatMetric, mutedText } from '../_utils';
import { ChartCard } from './chart-card';

type TrendChartProps = {
  data: TrendDatum[];
  metric: Metric;
  amountUnit: AmountUnit;
  hasForecast: boolean;
  className?: string;
};

function TrendTooltip({
  active,
  payload,
  label,
  metric,
  amountUnit,
}: {
  active?: boolean;
  payload?: Array<{ dataKey?: string; value?: number }>;
  label?: string;
  metric: Metric;
  amountUnit: AmountUnit;
}) {
  if (!active || !payload?.length) return null;
  const point = payload.find(
    (p) => (p.dataKey === 'actual' || p.dataKey === 'forecast') && p.value != null
  );
  if (!point) return null;
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white shadow-xl">
      <p className="font-semibold">{label}</p>
      <p className="mt-1 tabular-nums">
        {point.dataKey === 'forecast' ? 'Proqnoz: ' : ''}
        {formatMetric(point.value ?? 0, metric, amountUnit)}
      </p>
    </div>
  );
}

export function TrendChart({
  data,
  metric,
  amountUnit,
  hasForecast,
  className,
}: TrendChartProps) {
  const isDark = useShellTheme();
  const axisColor = isDark ? '#94a3b8' : '#64748b';

  const subtitle = hasForecast
    ? 'Qurğu tipləri üzrə cəmi — ilin sonuna qədər proqnozla'
    : 'Qurğu tipləri üzrə cəmi dövriyyənin zaman üzrə dəyişməsi';

  return (
    <ChartCard
      title="Zaman trendi"
      subtitle={subtitle}
      empty={data.length === 0}
      className={className}
    >
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 16, left: -4, bottom: 0 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={isDark ? '#1e293b' : '#e2e8f0'}
              vertical={false}
            />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: axisColor }}
            />
            <YAxis
              width={52}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: axisColor }}
              tickFormatter={(value: number) => formatAxisTick(value, metric, amountUnit)}
            />
            <Tooltip content={<TrendTooltip metric={metric} amountUnit={amountUnit} />} />
            {/* Proqnoz güvən zolağı (lower–upper). */}
            <Area
              dataKey={(d: TrendDatum) =>
                d.lower != null && d.upper != null ? [d.lower, d.upper] : null
              }
              stroke="none"
              fill="#f59e0b"
              fillOpacity={0.12}
              connectNulls={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="actual"
              name="Faktiki"
              stroke="#3b82f6"
              strokeWidth={2.5}
              dot={{ r: 3, fill: '#3b82f6' }}
              activeDot={{ r: 5 }}
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="forecast"
              name="Proqnoz"
              stroke="#f59e0b"
              strokeWidth={2.5}
              strokeDasharray="5 4"
              dot={{ r: 3, fill: '#f59e0b' }}
              connectNulls={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold">
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-4 rounded-full bg-[#3b82f6]" />
          Faktiki
        </span>
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-4 rounded-full bg-[#f59e0b]" />
          Proqnoz
        </span>
        {!hasForecast && (
          <span className={mutedText(isDark)}>
            (proqnoz üçün kifayət qədər tarixçə yoxdur)
          </span>
        )}
      </div>
    </ChartCard>
  );
}
