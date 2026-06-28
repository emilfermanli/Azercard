import { ArrowDownRight, ArrowUpRight } from 'lucide-react';

import { useShellTheme } from '@/widgets/app-shell/shell-theme-context';
import type { ColumnRow, Measure } from '../_types';
import { formatPct, measureValue, mutedText, panelClass, signedPct } from '../_utils';

type BreakdownColumnProps = {
  title: string;
  subtitle: string;
  rows: ColumnRow[];
  measure: Measure;
  loading?: boolean;
  onSelect: (value: string) => void;
  hint?: string;
};

/** Dəyişmə faizinin işarəyə görə badge rəngi. */
function changeBadgeClass(change: number, isDark: boolean): string {
  if (change > 0)
    return isDark
      ? 'bg-emerald-500/15 text-emerald-400'
      : 'bg-emerald-50 text-emerald-600';
  if (change < 0)
    return isDark ? 'bg-rose-500/15 text-rose-400' : 'bg-rose-50 text-rose-600';
  return isDark ? 'bg-slate-700/40 text-slate-400' : 'bg-slate-100 text-slate-500';
}

function RowSkeleton({ isDark }: { isDark: boolean }) {
  const block = isDark ? 'bg-slate-800' : 'bg-slate-200';
  return (
    <li className="animate-pulse rounded-lg border border-transparent px-3 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className={['h-3 w-24 rounded', block].join(' ')} />
        <div className={['h-3 w-12 rounded', block].join(' ')} />
      </div>
      <div className={['mt-2.5 h-1.5 w-full rounded-full', block].join(' ')} />
    </li>
  );
}

/**
 * Kliklənən bölgü sütunu — hər sətir bir dəyər (bank / qurğu / kateqoriya).
 * Hər sətirdə bütün göstəricilər görünür: pay barı + faiz + seçilmiş göstəricinin
 * mütləq dəyəri + ikinci göstərici + dövrlərarası dəyişmə.
 * Sətrə klik bütün lövhəni cross-filter edir (təkrar klik = götürür).
 */
export function BreakdownColumn({
  title,
  subtitle,
  rows,
  measure,
  loading = false,
  onSelect,
  hint,
}: BreakdownColumnProps) {
  const isDark = useShellTheme();
  const trackClass = isDark ? 'bg-slate-800' : 'bg-slate-200';

  return (
    <section
      className={[
        'flex min-w-0 flex-col rounded-xl border p-3 shadow-lg',
        panelClass(isDark),
      ].join(' ')}
    >
      <div className="mb-2 flex items-center justify-between gap-2 px-1">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-bold">{title}</h2>
          <p className={['text-[11px]', mutedText(isDark)].join(' ')}>{subtitle}</p>
        </div>
        {!loading && rows.length > 0 && (
          <span
            className={[
              'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums',
              isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600',
            ].join(' ')}
          >
            {rows.length}
          </span>
        )}
      </div>

      {loading ? (
        <ul className="flex flex-col gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <RowSkeleton key={i} isDark={isDark} />
          ))}
        </ul>
      ) : rows.length === 0 ? (
        <div
          className={[
            'flex flex-1 items-center justify-center px-2 py-8 text-center text-xs',
            mutedText(isDark),
          ].join(' ')}
        >
          {hint ?? 'Məlumat yoxdur'}
        </div>
      ) : (
        <ul className="flex max-h-[28rem] flex-col gap-1.5 overflow-y-auto pr-1">
          {rows.map((row, index) => {
            const barColor = row.selected ? 'bg-amber-400' : 'bg-blue-500';
            return (
              <li key={row.value || '∅'}>
                <button
                  type="button"
                  onClick={() => onSelect(row.value)}
                  aria-pressed={row.selected}
                  title={`${row.label} · ${measureValue(row, measure)}`}
                  className={[
                    'group w-full rounded-lg border px-3 py-2.5 text-left transition',
                    row.selected
                      ? isDark
                        ? 'border-amber-400/60 bg-amber-400/10'
                        : 'border-amber-300 bg-amber-50'
                      : isDark
                        ? 'border-slate-800 bg-slate-950/40 hover:border-blue-500/40 hover:bg-slate-900'
                        : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/60',
                  ].join(' ')}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className={[
                          'flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[10px] font-bold tabular-nums',
                          row.selected
                            ? 'bg-amber-400 text-slate-900'
                            : isDark
                              ? 'bg-slate-800 text-slate-400'
                              : 'bg-slate-100 text-slate-500',
                        ].join(' ')}
                      >
                        {index + 1}
                      </span>
                      <span className="truncate text-xs font-semibold">{row.label}</span>
                    </div>
                    <span className="shrink-0 text-sm font-bold tabular-nums">
                      {measureValue(row, measure)}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center gap-2">
                    <div
                      className={[
                        'h-1.5 flex-1 overflow-hidden rounded-full',
                        trackClass,
                      ].join(' ')}
                    >
                      <div
                        className={['h-full rounded-full transition-all', barColor].join(
                          ' '
                        )}
                        style={{ width: `${Math.min(100, Math.max(2, row.percent))}%` }}
                      />
                    </div>
                    <span className="w-12 shrink-0 text-right text-[11px] font-semibold tabular-nums">
                      {formatPct(row.percent)}
                    </span>
                    {row.changePercent !== 0 && (
                      <span
                        className={[
                          'flex shrink-0 items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-semibold tabular-nums',
                          changeBadgeClass(row.changePercent, isDark),
                        ].join(' ')}
                      >
                        {row.changePercent > 0 ? (
                          <ArrowUpRight className="h-3 w-3" />
                        ) : (
                          <ArrowDownRight className="h-3 w-3" />
                        )}
                        {signedPct(row.changePercent)}
                      </span>
                    )}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
