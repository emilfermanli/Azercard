import { ArrowDownRight, ArrowRightLeft, ArrowUpRight, Wallet, X } from 'lucide-react';

import { useShellTheme } from '@/widgets/app-shell/shell-theme-context';
import type { TdKpi } from '@/types/card-transaction-detailed.type';
import { MEASURE_OPTIONS } from '../_constants';
import type { ColumnKey, Measure, SelectionChip } from '../_types';
import { formatAmount, formatInt, mutedText, panelClass, signedPct } from '../_utils';

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

type StatProps = {
  icon: React.ReactNode;
  label: string;
  value: string;
  active: boolean;
};

/** Tək KPI bloku — aktiv göstərici (seçilmiş) vurğulanır. */
function Stat({ icon, label, value, active }: StatProps) {
  const isDark = useShellTheme();
  return (
    <div
      className={[
        'flex items-center gap-3 rounded-xl border px-3.5 py-2.5 transition',
        active
          ? isDark
            ? 'border-blue-500/40 bg-blue-500/10'
            : 'border-blue-200 bg-blue-50'
          : isDark
            ? 'border-slate-800 bg-slate-950/40'
            : 'border-slate-200 bg-slate-50',
      ].join(' ')}
    >
      <span
        className={[
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
          active
            ? 'bg-blue-600 text-white'
            : isDark
              ? 'bg-slate-800 text-slate-300'
              : 'bg-white text-slate-500',
        ].join(' ')}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p
          className={[
            'text-[11px] font-semibold uppercase tracking-wide',
            mutedText(isDark),
          ].join(' ')}
        >
          {label}
        </p>
        <p className="text-xl font-bold tabular-nums leading-tight">{value}</p>
      </div>
    </div>
  );
}

type ToolbarProps = {
  kpi: TdKpi | undefined;
  measure: Measure;
  onMeasureChange: (m: Measure) => void;
  chips: SelectionChip[];
  onClearChip: (key: ColumnKey) => void;
};

export function Toolbar({
  kpi,
  measure,
  onMeasureChange,
  chips,
  onClearChip,
}: ToolbarProps) {
  const isDark = useShellTheme();
  const amount = kpi ? `${formatAmount(kpi.totalAmount)} ₼` : '—';
  const count = kpi ? formatInt(kpi.totalCount) : '—';
  const change = kpi?.changePercent ?? 0;

  return (
    <section
      className={[
        'flex flex-col gap-4 rounded-xl border px-4 py-3 shadow-lg lg:flex-row lg:items-center lg:justify-between',
        panelClass(isDark),
      ].join(' ')}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <Stat
            icon={<Wallet className="h-[1.1rem] w-[1.1rem]" />}
            label="Ümumi dövriyyə"
            value={amount}
            active={measure === 'amount'}
          />
          <Stat
            icon={<ArrowRightLeft className="h-[1.1rem] w-[1.1rem]" />}
            label="Əməliyyat sayı"
            value={count}
            active={measure === 'count'}
          />
        </div>

        {change !== 0 && (
          <span
            className={[
              'flex w-fit items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold tabular-nums',
              change > 0
                ? isDark
                  ? 'bg-emerald-500/15 text-emerald-400'
                  : 'bg-emerald-50 text-emerald-600'
                : isDark
                  ? 'bg-rose-500/15 text-rose-400'
                  : 'bg-rose-50 text-rose-600',
            ].join(' ')}
            title="Keçən dövrlə müqayisədə dəyişmə"
          >
            {change > 0 ? (
              <ArrowUpRight className="h-3.5 w-3.5" />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5" />
            )}
            {signedPct(change)}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3 justify-end">
          <p className={['text-xs font-semibold', mutedText(isDark)].join(' ')}>
            Göstərici
          </p>
          <Segmented<Measure>
            value={measure}
            options={MEASURE_OPTIONS}
            onChange={onMeasureChange}
          />
        </div>

        {chips.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
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
    </section>
  );
}
