import { AlertTriangle } from 'lucide-react';
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
import { useAmountUnit } from '../_context/amount-unit-context';
import type { AlertItem, Metric, TrendDatum } from '../_types';
import {
  buildMetricAxisTicks,
  formatMetricExactValue,
  formatMetricValue,
  formatPct,
  getMetricUnitTag,
  mutedText,
  type AmountUnit,
} from '../_utils';
import { ChartCard } from './chart-card';

type TrendChartProps = {
  data: TrendDatum[];
  alerts: AlertItem[];
  metric: Metric;
  metricLabel: string;
  hasForecast: boolean;
  className?: string;
};

function TrendTooltip({
  active,
  payload,
  label,
  metric,
  unit,
}: {
  active?: boolean;
  payload?: Array<{ dataKey?: string; value?: number }>;
  label?: string;
  metric: Metric;
  unit: AmountUnit;
}) {
  if (!active || !payload?.length) return null;
  const point = payload.find(
    (p) => (p.dataKey === 'actual' || p.dataKey === 'forecast') && p.value != null
  );
  if (!point || point.value == null) return null;

  const formattedValue = formatMetricValue(point.value, metric, unit);
  const exactValue = formatMetricExactValue(point.value, metric);

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white shadow-xl">
      <p className="font-semibold">{label}</p>
      <p className="mt-1 tabular-nums">
        {point.dataKey === 'forecast' ? 'Proqnoz: ' : ''}
        {formattedValue}
      </p>
      {exactValue && exactValue !== formattedValue && (
        <p className="mt-0.5 text-[11px] text-slate-300 tabular-nums">
          Tam: {exactValue}
        </p>
      )}
    </div>
  );
}

export function TrendChart({
  data,
  alerts,
  metric,
  metricLabel,
  hasForecast,
  className,
}: TrendChartProps) {
  const isDark = useShellTheme();
  const { unit } = useAmountUnit();
  const axisColor = isDark ? '#94a3b8' : '#64748b';

  const unitTag = getMetricUnitTag(metric, unit);

  let minRaw = 0;
  let maxRaw = 0;
  let hasNumeric = false;
  let actualSum = 0;
  let hasActual = false;

  for (const d of data) {
    if (d.actual != null && Number.isFinite(d.actual)) {
      actualSum += d.actual;
      hasActual = true;
    }
    for (const v of [d.actual, d.forecast, d.low, d.high]) {
      if (v != null && Number.isFinite(v)) {
        if (!hasNumeric) {
          minRaw = v;
          maxRaw = v;
          hasNumeric = true;
        } else {
          if (v < minRaw) minRaw = v;
          if (v > maxRaw) maxRaw = v;
        }
      }
    }
  }

  const yTicks =
    hasNumeric && minRaw >= 0 && maxRaw > 0
      ? buildMetricAxisTicks(maxRaw, metric, unit, 5)
      : undefined;

  const formatYAxisTick = (value: number) =>
    formatMetricValue(value, metric, unit, {
      includeCurrency: false,
      bareZero: true,
    });

  const sampleValues = yTicks ?? (hasNumeric ? [minRaw, maxRaw] : [0]);
  const maxTickLen = Math.max(0, ...sampleValues.map((v) => formatYAxisTick(v).length));
  const yAxisWidth = Math.min(156, Math.max(72, Math.ceil(maxTickLen * 7.5 + 16)));

  const showTotal = hasActual && (metric === 'amount' || metric === 'count');
  const formattedTotal = showTotal
    ? formatMetricValue(actualSum, metric, unit)
    : null;
  const exactTotal = showTotal
    ? formatMetricExactValue(actualSum, metric)
    : undefined;

  return (
    <ChartCard
      title="Artma / azalma tendensiyası"
      subtitle={`${metricLabel}${unitTag} — zaman üzrə${hasForecast ? ' (proqnozla)' : ''}`}
      empty={data.length === 0}
      className={className}
    >
      {alerts.length > 0 && (
        <div className="mb-3 space-y-1.5">
          {alerts.map((alert) => (
            <div
              key={alert.label}
              className={[
                'flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold',
                alert.changePct >= 0
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-500'
                  : 'border-red-500/40 bg-red-500/10 text-red-500',
              ].join(' ')}
            >
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              <span>
                {alert.label}: {alert.changePct >= 0 ? '+' : ''}
                {formatPct(alert.changePct)} dəyişmə
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 16, left: 4, bottom: 0 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={isDark ? '#1e293b' : '#e2e8f0'}
              vertical={false}
            />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              minTickGap={24}
              tick={{ fontSize: 12, fill: axisColor }}
            />
            <YAxis
              width={yAxisWidth}
              tickLine={false}
              axisLine={false}
              ticks={yTicks}
              domain={yTicks ? [0, yTicks[yTicks.length - 1]] : undefined}
              tick={{ fontSize: 12, fill: axisColor }}
              tickFormatter={formatYAxisTick}
            />
            <Tooltip content={<TrendTooltip metric={metric} unit={unit} />} />
            {/* Proqnoz güvən zolağı (aşağı–yuxarı hədd). */}
            <Area
              dataKey={(d: TrendDatum) =>
                d.low != null && d.high != null ? [d.low, d.high] : null
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

      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs font-semibold">
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-4 rounded-full bg-[#3b82f6]" />
            Faktiki
          </span>
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-4 rounded-full bg-[#f59e0b]" />
            Proqnoz (aşağı–yuxarı hədd)
          </span>
          {!hasForecast && (
            <span className={mutedText(isDark)}>
              (proqnoz üçün kifayət qədər tarixçə yoxdur)
            </span>
          )}
        </div>
        {formattedTotal && (
          <span
            title={exactTotal}
            className={['tabular-nums', mutedText(isDark)].join(' ')}
          >
            Cəm: {formattedTotal}
          </span>
        )}
      </div>
    </ChartCard>
  );
}
