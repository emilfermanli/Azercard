import { useShellTheme } from '@/widgets/app-shell/shell-theme-context';
import { DATE_GROUPING_OPTIONS, ROUND_TO_OPTIONS } from '../_constants';
import { mutedText, panelClass } from '../_utils';

type SegmentedProps = {
  label: string;
  value: number;
  options: Array<{ value: number; label: string }>;
  onChange: (value: number) => void;
};

function Segmented({ label, value, options, onChange }: SegmentedProps) {
  const isDark = useShellTheme();
  return (
    <div>
      <p className={['mb-1.5 text-xs font-semibold', mutedText(isDark)].join(' ')}>
        {label}
      </p>
      <div className="inline-flex rounded-lg border border-blue-500/30 p-1">
        {options.map((item) => (
          <button
            key={item.value}
            type="button"
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
  roundTo: number;
  onRoundToChange: (value: number) => void;
  dateGrouping: number;
  onDateGroupingChange: (value: number) => void;
};

export function DashboardToolbar({
  roundTo,
  onRoundToChange,
  dateGrouping,
  onDateGroupingChange,
}: ToolbarProps) {
  const isDark = useShellTheme();

  return (
    <section
      className={[
        'flex flex-wrap items-end gap-5 rounded-xl border px-4 py-3 shadow-lg',
        panelClass(isDark),
      ].join(' ')}
    >
      <Segmented
        label="Məbləğ vahidi"
        value={roundTo}
        options={ROUND_TO_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
        onChange={onRoundToChange}
      />
      <Segmented
        label="Tarix qruplaşması"
        value={dateGrouping}
        options={DATE_GROUPING_OPTIONS}
        onChange={onDateGroupingChange}
      />
    </section>
  );
}
