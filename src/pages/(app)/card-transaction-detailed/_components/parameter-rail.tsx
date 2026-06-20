import { useShellTheme } from '@/widgets/app-shell/shell-theme-context';
import { COLUMNS } from '../_constants';
import type { ColumnKey } from '../_types';
import { mutedText } from '../_utils';

type ParameterRailProps = {
  visible: Record<ColumnKey, boolean>;
  onToggle: (key: ColumnKey) => void;
};

/**
 * Ən soldakı parametr seçimi — hansı ölçü üzrə bölgü göstərilsin.
 * Birini seçdikdə sağda uyğun sütun açılır (toggle).
 */
export function ParameterRail({ visible, onToggle }: ParameterRailProps) {
  const isDark = useShellTheme();

  return (
    <div className="flex w-28 shrink-0 flex-col gap-2">
      <p className={['px-1 text-[11px] font-bold uppercase tracking-wide', mutedText(isDark)].join(' ')}>
        Parametrlər
      </p>
      {COLUMNS.map((col) => (
        <button
          key={col.key}
          type="button"
          onClick={() => onToggle(col.key)}
          aria-pressed={visible[col.key]}
          title={col.subtitle}
          className={[
            'rounded-lg px-3 py-2.5 text-left text-xs font-semibold shadow-sm transition',
            visible[col.key]
              ? 'bg-amber-400 text-slate-900 ring-2 ring-amber-300'
              : 'bg-blue-600 text-white hover:bg-blue-500',
          ].join(' ')}
        >
          {col.title}
        </button>
      ))}
    </div>
  );
}
