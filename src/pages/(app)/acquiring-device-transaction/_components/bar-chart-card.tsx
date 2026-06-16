import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { useShellTheme } from '@/widgets/app-shell/shell-theme-context';
import type { AmountUnit, BarDatum, Metric } from '../_types';
import { formatAxisTick, formatMetric } from '../_utils';
import { ChartCard } from './chart-card';

type BarChartCardProps = {
  title: string;
  subtitle?: string;
  data: BarDatum[];
  metric: Metric;
  amountUnit: AmountUnit;
  /** ən çox göstəriləcək sətir sayı (qalanları kəsilir). */
  maxRows?: number;
  className?: string;
};

const truncate = (text: string, max = 14) =>
  text.length > max ? `${text.slice(0, max)}…` : text;

function BarTooltip({
  active,
  payload,
  label,
  metric,
  amountUnit,
}: {
  active?: boolean;
  payload?: Array<{ value?: number }>;
  label?: string;
  metric: Metric;
  amountUnit: AmountUnit;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white shadow-xl">
      <p className="font-semibold">{label}</p>
      <p className="mt-1 tabular-nums">
        {formatMetric(payload[0].value ?? 0, metric, amountUnit)}
      </p>
    </div>
  );
}

export function BarChartCard({
  title,
  subtitle,
  data,
  metric,
  amountUnit,
  maxRows = 12,
  className,
}: BarChartCardProps) {
  const isDark = useShellTheme();
  const rows = [...data].sort((a, b) => b.value - a.value).slice(0, maxRows);
  const axisColor = isDark ? '#94a3b8' : '#64748b';
  const height = Math.max(220, rows.length * 30);

  return (
    <ChartCard
      title={title}
      subtitle={subtitle}
      empty={rows.length === 0}
      className={className}
    >
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={rows}
            layout="vertical"
            margin={{ top: 4, right: 16, left: 4, bottom: 4 }}
          >
            <XAxis
              type="number"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: axisColor }}
              tickFormatter={(value: number) => formatAxisTick(value, metric, amountUnit)}
            />
            <YAxis
              type="category"
              dataKey="label"
              width={96}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: axisColor }}
              tickFormatter={(value: string) => truncate(value)}
            />
            <Tooltip
              cursor={{ fill: isDark ? '#1e293b55' : '#eff6ff' }}
              content={<BarTooltip metric={metric} amountUnit={amountUnit} />}
            />
            <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={16}>
              {rows.map((item) => (
                <Cell key={item.label} fill={item.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
