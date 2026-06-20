import { useShellTheme } from '@/widgets/app-shell/shell-theme-context';
import type { AmountScale } from '@/types/summary-transaction.type';
import { SCALE_OPTIONS } from '../_constants';
import { mutedText, panelClass } from '../_utils';

type ToolbarProps = {
  scale: AmountScale;
  onScaleChange: (scale: AmountScale) => void;
};

export function Toolbar({ scale, onScaleChange }: ToolbarProps) {
  const isDark = useShellTheme();

  return (
    <section
      className={[
        'flex flex-wrap items-center justify-between gap-4 rounded-xl border px-4 py-3 shadow-lg',
        panelClass(isDark),
      ].join(' ')}
    >
      <p className={['text-sm', mutedText(isDark)].join(' ')}>
        Cədvəldəki bütün məbləğlər seçilmiş miqyasda göstərilir.
      </p>

      <div className="flex items-center gap-3">
        <span className={['text-xs font-semibold', mutedText(isDark)].join(' ')}>
          Məbləğ miqyası
        </span>
        <div className="inline-flex rounded-lg border border-blue-500/30 p-1">
          {SCALE_OPTIONS.map((item) => (
            <button
              key={item.value}
              type="button"
              title={item.hint}
              onClick={() => onScaleChange(item.value)}
              className={[
                'h-8 min-w-12 rounded-md px-3 text-xs font-semibold transition',
                scale === item.value
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
    </section>
  );
}
