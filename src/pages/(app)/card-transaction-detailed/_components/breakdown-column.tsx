import { useShellTheme } from '@/widgets/app-shell/shell-theme-context';
import type { ColumnRow, DisplayMode, Measure } from '../_types';
import { formatCell, mutedText, panelClass, rowValue, subtlePanelClass } from '../_utils';

type BreakdownColumnProps = {
  title: string;
  subtitle: string;
  rows: ColumnRow[];
  measure: Measure;
  display: DisplayMode;
  onSelect: (value: string) => void;
  hint?: string;
};

/**
 * Kliklənən bölgü sütunu — hər sətir bir dəyər (bank / qurğu / kateqoriya).
 * Sətrə klik həmin dəyəri seçir və bütün lövhəni cross-filter edir (təkrar klik = götürür).
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
  const maxValue = Math.max(1, ...rows.map((r) => rowValue(r, measure)));

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
        <ul className="flex max-h-[26rem] flex-col gap-1.5 overflow-y-auto pr-1">
          {rows.map((row) => {
            const width = Math.round((rowValue(row, measure) / maxValue) * 100);
            return (
              <li key={row.value || '∅'}>
                <button
                  type="button"
                  onClick={() => onSelect(row.value)}
                  aria-pressed={row.selected}
                  title={row.label}
                  className={[
                    'relative w-full overflow-hidden rounded-lg border px-2.5 py-1.5 text-left transition',
                    row.selected
                      ? 'border-blue-500 ring-1 ring-blue-500'
                      : isDark
                        ? 'border-slate-800 hover:border-slate-600'
                        : 'border-slate-200 hover:border-slate-300',
                    subtlePanelClass(isDark),
                  ].join(' ')}
                >
                  <span
                    className="absolute inset-y-0 left-0 bg-blue-500/15"
                    style={{ width: `${width}%` }}
                    aria-hidden="true"
                  />
                  <span className="relative flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-medium">{row.label}</span>
                    <span className="shrink-0 text-xs font-bold tabular-nums">
                      {formatCell(row, measure, display)}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
