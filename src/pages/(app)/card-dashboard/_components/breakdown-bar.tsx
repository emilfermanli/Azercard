import { useState } from 'react';
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
import type { DisplayMode, DonutDatum } from '../_types';
import { formatPct } from '../_utils';
import { ChartCard } from './chart-card';

type BreakdownBarProps = {
  title: string;
  subtitle: string;
  data: DonutDatum[];
  maxRows?: number;
};

const truncate = (text: string, max = 16) =>
  text.length > max ? `${text.slice(0, max)}…` : text;

const compact = (value: number) =>
  new Intl.NumberFormat('az-AZ', { notation: 'compact', maximumFractionDigits: 1 }).format(
    value
  );

function BarTooltip({
  active,
  payload,
  mode,
}: {
  active?: boolean;
  payload?: Array<{ payload?: DonutDatum }>;
  mode: DisplayMode;
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  if (!item) return null;
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white shadow-xl">
      <p className="font-semibold">{item.name}</p>
      <p className="mt-1 tabular-nums">
        {mode === 'pct' ? formatPct(item.pct) : item.valueLabel}
      </p>
    </div>
  );
}

/** Bölgü qrafiki — üfüqi bar + yuxarıda % / Number seçimi. */
export function BreakdownBar({ title, subtitle, data, maxRows = 12 }: BreakdownBarProps) {
  const isDark = useShellTheme();
  const [mode, setMode] = useState<DisplayMode>('pct');
  const axisColor = isDark ? '#94a3b8' : '#64748b';

  const rows = [...data]
    .sort((a, b) => b.value - a.value)
    .slice(0, maxRows)
    .map((d) => ({ ...d, metric: mode === 'pct' ? d.pct : d.value }));
  const height = Math.max(200, rows.length * 34);

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
    <ChartCard title={title} subtitle={subtitle} action={toggle} empty={rows.length === 0}>
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
              tickFormatter={(v: number) => (mode === 'pct' ? `${Math.round(v)}%` : compact(v))}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={100}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: axisColor }}
              tickFormatter={(v: string) => truncate(v)}
            />
            <Tooltip
              cursor={{ fill: isDark ? '#1e293b55' : '#eff6ff' }}
              content={<BarTooltip mode={mode} />}
            />
            <Bar dataKey="metric" radius={[0, 6, 6, 0]} barSize={16}>
              {rows.map((item) => (
                <Cell key={item.name} fill={item.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
