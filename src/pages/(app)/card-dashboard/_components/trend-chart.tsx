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
import type { AlertItem, TrendDatum } from '../_types';
import { formatMetricValue, formatPct, mutedText } from '../_utils';
import { ChartCard } from './chart-card';

type TrendChartProps = {
  data: TrendDatum[];
  alerts: AlertItem[];
  metricLabel: string;
  monetary: boolean;
  roundTo: number;
  hasForecast: boolean;
  className?: string;
};

const compact = (value: number) =>
  new Intl.NumberFormat('az-AZ', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);

function TrendTooltip({
  active,
  payload,
  label,
  monetary,
  roundTo,
}: {
  active?: boolean;
  payload?: Array<{ dataKey?: string; value?: number }>;
  label?: string;
  monetary: boolean;
  roundTo: number;
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
        {formatMetricValue(point.value ?? 0, monetary, roundTo)}
      </p>
    </div>
  );
}

export function TrendChart({
  data,
  alerts,
  metricLabel,
  monetary,
  roundTo,
  hasForecast,
  className,
}: TrendChartProps) {
  const isDark = useShellTheme();
  const axisColor = isDark ? '#94a3b8' : '#64748b';

  return (
    <ChartCard
      title="Artma / azalma tendensiyası"
      subtitle={`${metricLabel} — zaman üzrə${hasForecast ? ' (proqnozla)' : ''}`}
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
              width={56}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: axisColor }}
              tickFormatter={(value: number) => compact(value)}
            />
            <Tooltip content={<TrendTooltip monetary={monetary} roundTo={roundTo} />} />
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

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold">
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
    </ChartCard>
  );
}
