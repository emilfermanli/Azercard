import { useState } from 'react';
import { RefreshCcw } from 'lucide-react';

import { useShellTheme } from '@/widgets/app-shell/shell-theme-context';
import { DIMENSION_TABS, PERIOD_TABS } from '../_constants';
import type { DisplayRow } from '../_types';
import { formatCount, mutedText, panelClass, trendClasses } from '../_utils';
import { TrendIcon } from './trend-indicator';

type AnalysisSectionProps = {
  channels: string[];
  matrixRows: DisplayRow[];
  style?: React.CSSProperties;
};

export function AnalysisSection({ channels, matrixRows, style }: AnalysisSectionProps) {
  const isDark = useShellTheme();
  const muted = mutedText(isDark);
  const [isTransposed, setIsTransposed] = useState(false);

  const tableColumns = isTransposed ? matrixRows.map((row) => row.name) : channels;
  const tableRows: DisplayRow[] = isTransposed
    ? channels.map((channel, channelIndex) => ({
        name: channel,
        values: matrixRows.map((row) => row.values[channelIndex] ?? { amount: 0, trend: 'flat' }),
      }))
    : matrixRows;
  const matrixGridStyle = {
    gridTemplateColumns: `8rem repeat(${tableColumns.length}, minmax(5.75rem, 1fr))`,
  };
  const matrixMinWidth = `${8 + tableColumns.length * 5.75 + (tableColumns.length + 1) * 0.5}rem`;

  return (
    <section
      className={['min-w-0 rounded-xl border p-4 shadow-lg', panelClass(isDark)].join(' ')}
      style={style}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Kart aktivliyi</h1>
          <p className={['mt-1 text-sm', muted].join(' ')}>
            Kart brendləri və istiqamətlər üzrə əməliyyat göstəriciləri
          </p>
        </div>
        <div className="inline-flex rounded-lg border border-blue-500/30 p-1">
          {PERIOD_TABS.map((tab, index) => (
            <button
              key={tab}
              type="button"
              className={[
                'h-8 min-w-12 rounded-md px-3 text-xs font-semibold transition',
                index === 0
                  ? 'bg-blue-600 text-white'
                  : isDark
                    ? 'text-slate-300 hover:bg-slate-800'
                    : 'text-slate-600 hover:bg-slate-100',
              ].join(' ')}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[7rem_minmax(0,1fr)]">
        <div className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
          {DIMENSION_TABS.map((tab, index) => (
            <button
              key={tab.label}
              type="button"
              className={[
                'flex h-14 min-w-24 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-bold transition lg:min-w-0',
                index === 0
                  ? 'border-orange-500 bg-orange-500 text-white shadow-md shadow-orange-900/20'
                  : isDark
                    ? 'border-slate-700 bg-slate-800/80 text-slate-100 hover:bg-slate-800'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
              ].join(' ')}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="min-w-0 overflow-x-auto">
          <div style={{ minWidth: matrixMinWidth }}>
            <div className="grid gap-2" style={matrixGridStyle}>
              <div className="flex h-10 items-center justify-center">
                <button
                  type="button"
                  onClick={() => setIsTransposed((value) => !value)}
                  className={[
                    'flex h-10 w-10 items-center justify-center rounded-full border transition',
                    isDark
                      ? 'border-blue-500/40 bg-slate-800/80 text-blue-300 hover:bg-blue-500/20 hover:text-blue-200'
                      : 'border-blue-200 bg-white text-blue-700 hover:bg-blue-50',
                    isTransposed ? 'rotate-180' : '',
                  ].join(' ')}
                  aria-label="Sətir və sütunların yerini dəyiş"
                  title="Sətir və sütunların yerini dəyiş"
                >
                  <RefreshCcw className="h-5 w-5" />
                </button>
              </div>
              {tableColumns.map((column) => (
                <button
                  key={column}
                  type="button"
                  className={[
                    'h-10 rounded-lg border px-3 text-sm font-bold transition',
                    isDark
                      ? 'border-blue-500/40 bg-blue-500/20 text-slate-100 hover:bg-blue-500/30'
                      : 'border-blue-200 bg-blue-50 text-blue-950 hover:bg-blue-100',
                  ].join(' ')}
                >
                  {column}
                </button>
              ))}
            </div>

            <div className="mt-4 divide-y divide-slate-700/70">
              {tableRows.map((row) => (
                <div key={row.name} className="grid items-center gap-2 py-3" style={matrixGridStyle}>
                  <button
                    type="button"
                    className={[
                      'min-h-14 rounded-xl border px-3 text-base font-bold transition',
                      isDark
                        ? 'border-blue-500/40 bg-blue-500/25 text-white hover:bg-blue-500/35'
                        : 'border-blue-200 bg-blue-100 text-blue-950 hover:bg-blue-200',
                    ].join(' ')}
                  >
                    {row.name}
                  </button>
                  {row.values.map((cell, index) => (
                    <div
                      key={`${row.name}-${tableColumns[index]}`}
                      className="flex min-h-14 items-center justify-center gap-1.5 text-xl font-bold tabular-nums"
                    >
                      <span className={trendClasses(cell.trend)}>
                        <TrendIcon trend={cell.trend} />
                      </span>
                      <span>{formatCount(cell.amount)}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
