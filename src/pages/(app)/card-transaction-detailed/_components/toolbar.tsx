import { X } from 'lucide-react';

import { useShellTheme } from '@/widgets/app-shell/shell-theme-context';
import type { TdKpi } from '@/types/card-transaction-detailed.type';
import { DISPLAY_OPTIONS, MEASURE_OPTIONS } from '../_constants';
import type { ColumnKey, DisplayMode, Measure, SelectionChip } from '../_types';
import { formatAmount, formatInt, mutedText, panelClass } from '../_utils';

type SegmentedProps<T extends string> = {
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
};

function Segmented<T extends string>({ value, options, onChange }: SegmentedProps<T>) {
  const isDark = useShellTheme();
  return (
    <div className="inline-flex rounded-lg border border-blue-500/30 p-1">
      {options.map((item) => (
        <button
          key={item.value}
          type="button"
          onClick={() => onChange(item.value)}
          className={[
            'h-8 min-w-11 rounded-md px-3 text-xs font-semibold transition',
            value === item.value
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
  );
}

type ToolbarProps = {
  kpi: TdKpi | undefined;
  measure: Measure;
  onMeasureChange: (m: Measure) => void;
  display: DisplayMode;
  onDisplayChange: (d: DisplayMode) => void;
  chips: SelectionChip[];
  onClearChip: (key: ColumnKey) => void;
};

export function Toolbar({
  kpi,
  measure,
  onMeasureChange,
  display,
  onDisplayChange,
  chips,
  onClearChip,
}: ToolbarProps) {
  const isDark = useShellTheme();
  const total = kpi
    ? measure === 'count'
      ? formatInt(kpi.totalCount)
      : `${formatAmount(kpi.totalAmount)} ₼`
    : '—';

  return (
    <section
      className={[
        'flex flex-wrap items-end justify-between gap-4 rounded-xl border px-4 py-3 shadow-lg',
        panelClass(isDark),
      ].join(' ')}
    >
      <div>
        <p className={['text-xs font-semibold', mutedText(isDark)].join(' ')}>
          Ümumi {measure === 'count' ? 'əməliyyat sayı' : 'dövriyyə'}
        </p>
        <p className="mt-1 text-2xl font-bold tabular-nums">{total}</p>
        {chips.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {chips.map((chip) => (
              <button
                key={chip.key}
                type="button"
                onClick={() => onClearChip(chip.key)}
                className="flex items-center gap-1 rounded-full bg-blue-500/15 px-2.5 py-1 text-xs font-semibold text-blue-500 transition hover:bg-blue-500/25"
                title="Seçimi götür"
              >
                <span className="opacity-70">{chip.columnTitle}:</span> {chip.label}
                <X className="h-3 w-3" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-end gap-4">
        <div>
          <p className={['mb-1.5 text-xs font-semibold', mutedText(isDark)].join(' ')}>
            Göstərici
          </p>
          <Segmented<Measure>
            value={measure}
            options={MEASURE_OPTIONS}
            onChange={onMeasureChange}
          />
        </div>
        <div>
          <p className={['mb-1.5 text-xs font-semibold', mutedText(isDark)].join(' ')}>
            Göstərmə
          </p>
          <Segmented<DisplayMode>
            value={display}
            options={DISPLAY_OPTIONS}
            onChange={onDisplayChange}
          />
        </div>
      </div>
    </section>
  );
}
