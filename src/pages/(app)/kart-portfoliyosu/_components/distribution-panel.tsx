import { Columns2, PanelRightClose } from 'lucide-react';
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { useShellTheme } from '@/widgets/app-shell/shell-theme-context';
import { RIGHT_PANEL_MODES } from '../_constants';
import type { PieDatum, RightPanelMode, TrendDatum } from '../_types';
import { mutedText, panelClass, subtlePanelClass } from '../_utils';
import { ShareTooltip, TrendTooltip } from './chart-tooltips';

type DistributionPanelProps = {
  mode: RightPanelMode;
  onModeChange: (mode: RightPanelMode) => void;
  stacked: boolean;
  onUnstack: () => void;
  onClose: () => void;
  pieData: PieDatum[];
  trendChartData: TrendDatum[];
  trendLabel: string;
  style?: React.CSSProperties;
};

export function DistributionPanel({
  mode,
  onModeChange,
  stacked,
  onUnstack,
  onClose,
  pieData,
  trendChartData,
  trendLabel,
  style,
}: DistributionPanelProps) {
  const isDark = useShellTheme();
  const muted = mutedText(isDark);
  const iconButtonClass = [
    'flex h-9 w-9 items-center justify-center rounded-lg border transition',
    isDark
      ? 'border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white'
      : 'border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-950',
  ].join(' ');

  return (
    <aside
      className={['min-w-0 rounded-xl border p-4 shadow-lg', panelClass(isDark)].join(
        ' '
      )}
      style={style}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">
            {mode === 'share' ? 'Pay bölgüsü' : 'Trend'}
          </h2>
          <p className={['mt-1 text-sm', muted].join(' ')}>
            {mode === 'share'
              ? 'Ödəniş sistemləri üzrə kart payları'
              : 'Vaxt üzrə kart sayının dəyişməsi'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {stacked && (
            <button
              type="button"
              onClick={onUnstack}
              className={iconButtonClass}
              aria-label="Cədvəl və qrafiki yan-yana göstər"
              title="Yan-yana göstər"
            >
              <Columns2 className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className={iconButtonClass}
            aria-label="Paneli gizlət"
            title="Paneli gizlət"
          >
            <PanelRightClose className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-4 inline-flex rounded-lg border border-blue-500/30 p-1">
        {RIGHT_PANEL_MODES.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => onModeChange(item.value)}
            className={[
              'h-8 min-w-16 rounded-md px-3 text-xs font-semibold transition',
              mode === item.value
                ? 'bg-blue-600 text-white'
                : isDark
                  ? 'text-slate-300 hover:bg-slate-800'
                  : 'text-slate-600 hover:bg-slate-100',
            ].join(' ')}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className={['mt-4 rounded-xl border p-4', subtlePanelClass(isDark)].join(' ')}>
        {mode === 'share' ? (
          <>
            <div className="h-64 xl:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={<ShareTooltip />} />
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius="58%"
                    outerRadius="86%"
                    paddingAngle={2}
                    stroke="transparent"
                  >
                    {pieData.map((item) => (
                      <Cell key={item.name} fill={item.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
              {pieData.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center gap-2 whitespace-nowrap text-sm font-semibold"
                >
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span>{item.name}</span>
                  <span className={muted}>{item.value}%</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="h-64 xl:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={trendChartData}
                margin={{ top: 8, right: 12, left: -8, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={isDark ? '#1e293b' : '#e2e8f0'}
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: isDark ? '#94a3b8' : '#64748b' }}
                />
                <YAxis
                  width={48}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: isDark ? '#94a3b8' : '#64748b' }}
                />
                <Tooltip content={<TrendTooltip />} />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#3b82f6' }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <p className={['mt-4 text-sm leading-6', muted].join(' ')}>
        {mode === 'share'
          ? 'Seçilmiş filtrlər üzrə ödəniş sistemlərinin ümumi kart sayındakı payı.'
          : `"${trendLabel || '—'}" ödəniş sistemi üzrə son aylarda kart sayı.`}
      </p>
    </aside>
  );
}
