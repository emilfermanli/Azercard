import { useShellTheme } from '@/widgets/app-shell/shell-theme-context';
import type { DeviceCard } from '../_types';
import { mutedText, panelClass } from '../_utils';

type DeviceCardsProps = {
  cards: DeviceCard[];
  metricLabel: string;
  onToggle: (type: string) => void;
};

/**
 * Sağ panel — ACQUIRING_DEVICE_TYPE rəngli kartları.
 * Kartı klik etmək həmin qurğu tipini bütün qrafiklərə filtr kimi tətbiq edir (toggle).
 */
export function DeviceCards({ cards, metricLabel, onToggle }: DeviceCardsProps) {
  const isDark = useShellTheme();
  const anyActive = cards.some((card) => card.active);

  return (
    <aside
      className={[
        'flex shrink-0 flex-col gap-3 rounded-xl border p-3 shadow-lg xl:w-60',
        panelClass(isDark),
      ].join(' ')}
    >
      <div className="flex items-baseline justify-between px-1">
        <h2 className="text-sm font-bold">Qurğu tipləri</h2>
        <span className={['text-[11px]', mutedText(isDark)].join(' ')}>{metricLabel}</span>
      </div>

      {cards.length === 0 && (
        <p className={['px-1 py-6 text-center text-sm', mutedText(isDark)].join(' ')}>
          Məlumat yoxdur
        </p>
      )}

      {cards.map((card) => (
        <button
          key={card.type}
          type="button"
          onClick={() => onToggle(card.type)}
          aria-pressed={card.active}
          title="Bütün qrafikləri bu qurğu tipinə görə süz"
          className={[
            'group flex flex-col rounded-xl border bg-gradient-to-br p-3 text-left text-white shadow-lg transition',
            card.tone,
            card.active
              ? 'ring-2 ring-white ring-offset-2 ' +
                (isDark ? 'ring-offset-slate-900' : 'ring-offset-white')
              : anyActive
                ? 'opacity-60 hover:opacity-100'
                : 'hover:-translate-y-0.5',
          ].join(' ')}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="rounded-md border border-white/50 px-2 py-0.5 text-xs font-bold">
              {card.type}
            </span>
            <span className="text-sm font-bold">{card.share}</span>
          </div>
          <p className="mt-3 text-xl font-bold tabular-nums">{card.value}</p>
        </button>
      ))}

      {anyActive && (
        <p className={['px-1 text-center text-[11px]', mutedText(isDark)].join(' ')}>
          Filtri götürmək üçün aktiv kartı yenidən klikləyin
        </p>
      )}
    </aside>
  );
}
