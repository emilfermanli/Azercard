import { useShellTheme } from '@/widgets/app-shell/shell-theme-context';
import { AMOUNT_UNITS, GRANULARITY_OPTIONS, METRIC_OPTIONS } from '../_constants';
import type { AmountUnit, Metric } from '../_types';
import { mutedText, panelClass } from '../_utils';

type SegmentedProps<T extends string> = {
  label: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
  disabled?: boolean;
};

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
  disabled,
}: SegmentedProps<T>) {
  const isDark = useShellTheme();
  return (
    <div className={disabled ? 'opacity-50' : ''}>
      <p className={['mb-1.5 text-xs font-semibold', mutedText(isDark)].join(' ')}>
        {label}
      </p>
      <div className="inline-flex rounded-lg border border-blue-500/30 p-1">
        {options.map((item) => (
          <button
            key={item.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(item.value)}
            className={[
              'h-8 rounded-md px-3 text-xs font-semibold transition disabled:cursor-not-allowed',
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
    </div>
  );
}

type ToolbarProps = {
  totalValue: string;
  metric: Metric;
  onMetricChange: (metric: Metric) => void;
  amountUnit: AmountUnit;
  onAmountUnitChange: (unit: AmountUnit) => void;
  granularity: string;
  onGranularityChange: (granularity: string) => void;
};

export function DashboardToolbar({
  totalValue,
  metric,
  onMetricChange,
  amountUnit,
  onAmountUnitChange,
  granularity,
  onGranularityChange,
}: ToolbarProps) {
  const isDark = useShellTheme();
  const isCount = metric === 'count';
  const metricLabel = METRIC_OPTIONS.find((m) => m.value === metric)?.label ?? '';

  return (
    <section
      className={[
        'flex flex-wrap items-end justify-between gap-4 rounded-xl border px-4 py-3 shadow-lg',
        panelClass(isDark),
      ].join(' ')}
    >
      <div>
        <p className={['text-xs font-semibold', mutedText(isDark)].join(' ')}>
          Cəmi — {metricLabel}
        </p>
        <p className="mt-1 text-2xl font-bold tabular-nums">{totalValue}</p>
      </div>
      <div className="flex flex-wrap items-end gap-4">
        <Segmented<Metric>
          label="Kateqoriya"
          value={metric}
          options={METRIC_OPTIONS}
          onChange={onMetricChange}
        />
        <Segmented<AmountUnit>
          label="Məbləğ vahidi"
          value={amountUnit}
          options={AMOUNT_UNITS}
          onChange={onAmountUnitChange}
          disabled={isCount}
        />
        <Segmented<string>
          label="Trend addımı"
          value={granularity}
          options={GRANULARITY_OPTIONS}
          onChange={onGranularityChange}
        />
      </div>
    </section>
  );
}
