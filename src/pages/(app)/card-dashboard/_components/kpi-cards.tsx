import { useShellTheme } from '@/widgets/app-shell/shell-theme-context';
import type { KpiCard, Metric } from '../_types';

const ACCENTS: Record<Metric, string> = {
  amount: 'from-sky-500 to-blue-600',
  count: 'from-emerald-500 to-green-600',
  avg: 'from-violet-600 to-fuchsia-600',
  max: 'from-amber-500 to-orange-600',
};

type KpiCardsProps = {
  cards: KpiCard[];
  onSelect: (metric: Metric) => void;
};

/**
 * Yuxarı 4 KPI pəncərəsi — kliklə aktiv göstərici seçilir (trend + bölgülər ona uyğunlaşır).
 */
export function KpiCards({ cards, onSelect }: KpiCardsProps) {
  const isDark = useShellTheme();

  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <button
          key={card.key}
          type="button"
          onClick={() => onSelect(card.key)}
          aria-pressed={card.active}
          title="Bu göstərici üzrə trend və bölgüləri göstər"
          className={[
            'rounded-xl border bg-gradient-to-br p-4 text-left text-white shadow-lg transition',
            ACCENTS[card.key],
            card.active
              ? 'ring-2 ring-white ring-offset-2 ' +
                (isDark ? 'ring-offset-slate-900' : 'ring-offset-white')
              : 'opacity-90 hover:-translate-y-0.5 hover:opacity-100',
          ].join(' ')}
        >
          <p className="text-xs font-bold uppercase tracking-wide opacity-90">
            {card.label}
          </p>
          <p className="mt-3 text-2xl font-bold tabular-nums">{card.value}</p>
        </button>
      ))}
    </section>
  );
}
