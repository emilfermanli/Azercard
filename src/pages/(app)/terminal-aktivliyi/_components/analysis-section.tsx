import { RefreshCcw } from 'lucide-react';

import { useShellTheme } from '@/widgets/app-shell/shell-theme-context';
import type { DeviceDimension } from '@/types/devices.type';
import { DIMENSION_TABS } from '../_constants';
import type { DisplayRow } from '../_types';
import { formatCount, mutedText, panelClass, trendClasses } from '../_utils';
import { TrendIcon } from './trend-indicator';

type AnalysisSectionProps = {
  channels: string[];
  matrixRows: DisplayRow[];
  xDimension: DeviceDimension;
  yDimension: DeviceDimension;
  onXChange: (dimension: DeviceDimension) => void;
  onYChange: (dimension: DeviceDimension) => void;
  onSwap: () => void;
  style?: React.CSSProperties;
};

function DimensionPicker({
  label,
  active,
  onPick,
  isDark,
}: {
  label: string;
  active: DeviceDimension;
  onPick: (dimension: DeviceDimension) => void;
  isDark: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className={['text-xs font-semibold uppercase tracking-wide', mutedText(isDark)].join(' ')}>
        {label}
      </span>
      <div className="inline-flex flex-wrap gap-1 rounded-lg border border-blue-500/30 p-1">
        {DIMENSION_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => onPick(tab.value)}
            className={[
              'flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold transition',
              tab.value === active
                ? 'bg-blue-600 text-white'
                : isDark
                  ? 'text-slate-300 hover:bg-slate-800'
                  : 'text-slate-600 hover:bg-slate-100',
            ].join(' ')}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function AnalysisSection({
  channels,
  matrixRows,
  xDimension,
  yDimension,
  onXChange,
  onYChange,
  onSwap,
  style,
}: AnalysisSectionProps) {
  const isDark = useShellTheme();
  const muted = mutedText(isDark);

  const tableColumns = channels;
  const tableRows = matrixRows;
  const matrixGridStyle = {
    gridTemplateColumns: `8rem repeat(${tableColumns.length}, minmax(5.75rem, 1fr))`,
  };
  const matrixMinWidth = `${8 + tableColumns.length * 5.75 + (tableColumns.length + 1) * 0.5}rem`;

  return (
    <section
      className={['min-w-0 rounded-xl border p-4 shadow-lg', panelClass(isDark)].join(' ')}
      style={style}
    >
      <div>
        <h1 className="text-2xl font-bold">Terminal aktivliyi</h1>
        <p className={['mt-1 text-sm', muted].join(' ')}>
          Terminal brendləri və istiqamətlər üzrə əməliyyat göstəriciləri
        </p>
      </div>

      {/* X / Y ölçü seçiciləri — cədvəlin üstündə */}
      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
        <DimensionPicker label="Sətir (Y)" active={yDimension} onPick={onYChange} isDark={isDark} />
        <DimensionPicker label="Sütun (X)" active={xDimension} onPick={onXChange} isDark={isDark} />
      </div>

      <div className="mt-4 min-w-0 overflow-x-auto">
        <div style={{ minWidth: matrixMinWidth }}>
          <div className="grid gap-2" style={matrixGridStyle}>
            <div className="flex h-10 items-center justify-center">
              <button
                type="button"
                onClick={onSwap}
                className={[
                  'flex h-10 w-10 items-center justify-center rounded-full border transition',
                  isDark
                    ? 'border-blue-500/40 bg-slate-800/80 text-blue-300 hover:bg-blue-500/20 hover:text-blue-200'
                    : 'border-blue-200 bg-white text-blue-700 hover:bg-blue-50',
                ].join(' ')}
                aria-label="X və Y ölçülərini dəyiş"
                title="X və Y ölçülərini dəyiş"
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
    </section>
  );
}
