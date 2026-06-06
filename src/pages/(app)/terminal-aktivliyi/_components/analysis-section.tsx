import { RefreshCcw } from 'lucide-react';

import { Loading, LoadingSpinner } from '@/components';
import { useShellTheme } from '@/widgets/app-shell/shell-theme-context';
import type { DeviceDimension } from '@/types/devices.type';
import type { DisplayRow } from '../_types';
import { formatCount, mutedText, panelClass, trendClasses } from '../_utils';
import { MatrixDimensionToolbar } from './matrix-dimension-toolbar';
import { TrendIcon } from './trend-indicator';

type AnalysisSectionProps = {
  channels: string[];
  matrixRows: DisplayRow[];
  xDimension: DeviceDimension;
  yDimension: DeviceDimension;
  onXChange: (dimension: DeviceDimension) => void;
  onYChange: (dimension: DeviceDimension) => void;
  onSwap: () => void;
  isMatrixLoading: boolean;
  isMatrixFetching: boolean;
  style?: React.CSSProperties;
};

export function AnalysisSection({
  channels,
  matrixRows,
  xDimension,
  yDimension,
  onXChange,
  onYChange,
  onSwap,
  isMatrixLoading,
  isMatrixFetching,
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
      className={['min-w-0 rounded-xl border p-4 shadow-lg', panelClass(isDark)].join(
        ' '
      )}
      style={style}
    >
      <div>
        <h1 className="text-2xl font-bold">Terminal aktivliyi</h1>
        <p className={['mt-1 text-sm', muted].join(' ')}>
          Terminal brendləri və istiqamətlər üzrə əməliyyat göstəriciləri
        </p>
      </div>

      <MatrixDimensionToolbar
        xDimension={xDimension}
        yDimension={yDimension}
        onXChange={onXChange}
        onYChange={onYChange}
        onSwap={onSwap}
        isDark={isDark}
      />

      <div
        className="relative mt-4 min-w-0"
        aria-busy={isMatrixLoading || isMatrixFetching}
      >
        {isMatrixLoading ? (
          <Loading className="min-h-48 rounded-xl border border-dashed border-blue-500/25" />
        ) : (
          <>
            {isMatrixFetching && (
              <div
                className={[
                  'pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-xl',
                  isDark ? 'bg-slate-950/50' : 'bg-white/70',
                ].join(' ')}
              >
                <LoadingSpinner
                  size="lg"
                  className={isDark ? 'text-blue-300' : 'text-blue-600'}
                />
                <span className={['text-sm font-medium', muted].join(' ')}>
                  Yenilənir...
                </span>
              </div>
            )}
            <div
              className={[
                'min-w-0 overflow-x-auto transition-opacity duration-200',
                isMatrixFetching ? 'opacity-40' : 'animate-in fade-in',
              ].join(' ')}
            >
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
                      aria-label="Sətir və sütun ölçülərini dəyiş"
                      title="Sətir və sütun ölçülərini dəyiş"
                    >
                      <RefreshCcw className="h-5 w-5" />
                    </button>
                  </div>
                  {tableColumns.map((column) => (
                    <button
                      key={column}
                      type="button"
                      title={column}
                      className={[
                        'flex h-10 min-w-0 items-center justify-center rounded-lg border px-2 text-xs font-bold transition sm:px-3 sm:text-sm',
                        isDark
                          ? 'border-blue-500/40 bg-blue-500/20 text-slate-100 hover:bg-blue-500/30'
                          : 'border-blue-200 bg-blue-50 text-blue-950 hover:bg-blue-100',
                      ].join(' ')}
                    >
                      <span className="truncate">{column}</span>
                    </button>
                  ))}
                </div>

                <div className="mt-4 divide-y divide-slate-700/70">
                  {tableRows.map((row) => (
                    <div
                      key={row.name}
                      className="grid items-center gap-2 py-3"
                      style={matrixGridStyle}
                    >
                      <button
                        type="button"
                        title={row.name}
                        className={[
                          'flex min-h-14 min-w-0 items-center rounded-xl border px-2 text-xs font-bold transition sm:px-3 sm:text-sm lg:text-base',
                          isDark
                            ? 'border-blue-500/40 bg-blue-500/25 text-white hover:bg-blue-500/35'
                            : 'border-blue-200 bg-blue-100 text-blue-950 hover:bg-blue-200',
                        ].join(' ')}
                      >
                        <span className="line-clamp-2 text-left leading-tight">
                          {row.name}
                        </span>
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
          </>
        )}
      </div>
    </section>
  );
}
