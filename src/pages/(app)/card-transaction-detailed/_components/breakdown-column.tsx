import { useShellTheme } from '@/widgets/app-shell/shell-theme-context';
import type { ColumnRow, DisplayMode, Measure } from '../_types';
import { formatCell, mutedText, panelClass } from '../_utils';

type BreakdownColumnProps = {
  title: string;
  subtitle: string;
  rows: ColumnRow[];
  measure: Measure;
  display: DisplayMode;
  onSelect: (value: string) => void;
  hint?: string;
};

/** Dəyişmə %-nin işarəyə görə rəngi (seçilmiş = açıq amber fon, normal = mavi fon). */
function changeClass(change: number, selected: boolean): string {
  if (change > 0) return selected ? 'text-emerald-700' : 'text-emerald-200';
  if (change < 0) return selected ? 'text-rose-700' : 'text-rose-200';
  return selected ? 'text-slate-700' : 'text-white/70';
}

const signedPct = (v: number) =>
  `${v > 0 ? '+' : ''}${v.toLocaleString('az-AZ', { maximumFractionDigits: 1 })}%`;

/**
 * Kliklənən bölgü sütunu — hər sətir bir dəyər (bank / qurğu / kateqoriya).
 * Seçilən plə amber, seçilməyən mavi; sətrə klik bütün lövhəni cross-filter edir (təkrar klik = götürür).
 */
export function BreakdownColumn({
  title,
  subtitle,
  rows,
  measure,
  display,
  onSelect,
  hint,
}: BreakdownColumnProps) {
  const isDark = useShellTheme();

  return (
    <section
      className={['flex min-w-0 flex-col rounded-xl border p-3 shadow-lg', panelClass(isDark)].join(
        ' '
      )}
    >
      <div className="mb-2 px-1">
        <h2 className="text-sm font-bold">{title}</h2>
        <p className={['text-[11px]', mutedText(isDark)].join(' ')}>{subtitle}</p>
      </div>

      {rows.length === 0 ? (
        <div
          className={['flex flex-1 items-center justify-center px-2 py-8 text-center text-xs', mutedText(isDark)].join(
            ' '
          )}
        >
          {hint ?? 'Məlumat yoxdur'}
        </div>
      ) : (
        <ul className="flex max-h-[26rem] flex-col gap-2 overflow-y-auto pr-1">
          {rows.map((row) => (
            <li key={row.value || '∅'}>
              <button
                type="button"
                onClick={() => onSelect(row.value)}
                aria-pressed={row.selected}
                title={row.label}
                className={[
                  'flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left shadow-sm transition',
                  row.selected
                    ? 'bg-amber-400 text-slate-900 ring-2 ring-amber-300'
                    : 'bg-blue-600 text-white hover:bg-blue-500',
                ].join(' ')}
              >
                <span className="truncate text-xs font-semibold">{row.label}</span>
                <span className="flex shrink-0 flex-col items-end leading-tight">
                  <span className="text-sm font-bold tabular-nums">
                    {formatCell(row, measure, display)}
                  </span>
                  <span
                    className={[
                      'text-[10px] font-semibold tabular-nums',
                      changeClass(row.changePercent, row.selected),
                    ].join(' ')}
                  >
                    {signedPct(row.changePercent)}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
