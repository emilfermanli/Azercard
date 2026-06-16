import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

import { useShellTheme } from '@/widgets/app-shell/shell-theme-context';
import type { AmountUnit, Metric, PieDatum } from '../_types';
import { formatMetric, mutedText } from '../_utils';
import { ChartCard } from './chart-card';

type ShareChartProps = {
  data: PieDatum[];
  metric: Metric;
  amountUnit: AmountUnit;
};

function ShareTooltip({
  active,
  payload,
  metric,
  amountUnit,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; payload?: PieDatum }>;
  metric: Metric;
  amountUnit: AmountUnit;
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white shadow-xl">
      <p className="font-semibold">{item.name}</p>
      <p className="mt-1 tabular-nums">{formatMetric(item.value ?? 0, metric, amountUnit)}</p>
    </div>
  );
}

export function ShareChart({ data, metric, amountUnit }: ShareChartProps) {
  const isDark = useShellTheme();
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <ChartCard
      title="Pay bölgüsü"
      subtitle="Qurğu tipləri üzrə pay"
      empty={data.length === 0}
    >
      <div className="h-60">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              content={<ShareTooltip metric={metric} amountUnit={amountUnit} />}
            />
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius="58%"
              outerRadius="86%"
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
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
        {data.map((item) => (
          <div
            key={item.name}
            className="flex items-center gap-2 whitespace-nowrap text-sm font-semibold"
          >
            <span
              className="h-3 w-3 shrink-0 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span>{item.name}</span>
            <span className={mutedText(isDark)}>
              {total ? Math.round((item.value / total) * 100) : 0}%
            </span>
          </div>
        ))}
      </div>
    </ChartCard>
  );
}
