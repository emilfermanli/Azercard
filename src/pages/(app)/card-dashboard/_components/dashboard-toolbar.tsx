import { useShellTheme } from '@/widgets/app-shell/shell-theme-context';
import { DATE_GROUPING_OPTIONS } from '../_constants';
import { useAmountUnit } from '../_context/amount-unit-context';
import { AMOUNT_UNIT_OPTIONS, type AmountUnit } from '../_format';
import { mutedText, panelClass } from '../_utils';

type SegmentedProps<T extends string | number> = {
  label: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
};

function Segmented<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: SegmentedProps<T>) {
  const isDark = useShellTheme();
  return (
    <div>
      <p className={['mb-1.5 text-xs font-semibold', mutedText(isDark)].join(' ')}>
        {label}
      </p>
      <div className="inline-flex rounded-lg border border-blue-500/30 p-1">
        {options.map((item) => (
          <button
            key={String(item.value)}
            type="button"
            aria-pressed={value === item.value}
            onClick={() => onChange(item.value)}
            className={[
              'h-8 rounded-md px-3 text-xs font-semibold transition',
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
  dateGrouping: number;
  onDateGroupingChange: (value: number) => void;
};

export function DashboardToolbar({
  dateGrouping,
  onDateGroupingChange,
}: ToolbarProps) {
  const isDark = useShellTheme();
  const { unit, setUnit } = useAmountUnit();

  return (
    <section
      className={[
        'flex flex-wrap items-end gap-5 rounded-xl border px-4 py-3 shadow-lg',
        panelClass(isDark),
      ].join(' ')}
    >
      <Segmented<AmountUnit>
        label="Məbləğ vahidi"
        value={unit}
        options={AMOUNT_UNIT_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
        onChange={setUnit}
      />
      <Segmented<number>
        label="Tarix qruplaşması"
        value={dateGrouping}
        options={DATE_GROUPING_OPTIONS}
        onChange={onDateGroupingChange}
      />
    </section>
  );
}
