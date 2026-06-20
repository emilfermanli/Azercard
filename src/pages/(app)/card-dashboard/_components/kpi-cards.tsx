import {
  ArrowRightLeft,
  Scale,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from 'lucide-react';

import type { KpiCard, Metric } from '../_types';

const ACCENTS: Record<Metric, string> = {
  amount: 'from-sky-500 to-blue-600',
  count: 'from-emerald-500 to-green-600',
  avg: 'from-violet-600 to-fuchsia-600',
  max: 'from-amber-500 to-orange-600',
};

// Hər KPI üçün məzmununa uyğun ikon.
const ICONS: Record<Metric, LucideIcon> = {
  amount: Wallet, // ümumi dövriyyə
  count: ArrowRightLeft, // əməliyyat sayı
  avg: Scale, // orta məbləğ
  max: TrendingUp, // maksimum ödəniş
};

/**
 * Ən uzun rəqəmə görə VAHİD şrift ölçüsü seçir — bütün kartlar eyni ölçüdə qalır,
 * yalnız biri çox uzun olanda hamısı birlikdə kiçilir (kartdan kənara çıxmasın).
 */
function sharedValueSizeClass(values: string[]): string {
  const maxLen = Math.max(0, ...values.map((v) => v.length));
  if (maxLen <= 9) return 'text-4xl';
  if (maxLen <= 12) return 'text-3xl';
  if (maxLen <= 16) return 'text-2xl';
  return 'text-xl';
}

type KpiCardsProps = {
  cards: KpiCard[];
  onSelect: (metric: Metric) => void;
};

/**
 * Yuxarı 4 KPI pəncərəsi — kliklə aktiv göstərici seçilir (trend + bölgülər ona uyğunlaşır).
 */
export function KpiCards({ cards, onSelect }: KpiCardsProps) {
  const valueSize = sharedValueSizeClass(cards.map((c) => c.value));

  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = ICONS[card.key];
        return (
          <button
            key={card.key}
            type="button"
            onClick={() => onSelect(card.key)}
            aria-pressed={card.active}
            className={[
              'flex min-h-[9.5rem] flex-col justify-between rounded-2xl bg-gradient-to-br p-6 text-left text-white shadow-lg transition duration-200',
              ACCENTS[card.key],
              // Seçilən tam rəngli, seçilməyənlər öz rəngində amma solğun (opacity).
              card.active
                ? 'opacity-100 shadow-xl'
                : 'opacity-50 hover:-translate-y-0.5 hover:opacity-100',
            ].join(' ')}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-bold uppercase tracking-wide opacity-90">
                {card.label}
              </p>
              {/* Sağ yuxarıda səliqəli badge. */}
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/20 ring-1 ring-white/30 shadow-sm">
                <Icon className="h-[1.35rem] w-[1.35rem]" strokeWidth={2.25} />
              </span>
            </div>
            <div className="group/val relative w-fit">
              <p
                className={[
                  'font-bold tabular-nums leading-tight break-words',
                  valueSize,
                ].join(' ')}
              >
                {card.value}
              </p>
              {/* Hover-da tam dəyər. */}
              <span className="pointer-events-none absolute left-0 top-full z-30 mt-1 hidden whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-xs font-semibold text-white shadow-xl ring-1 ring-white/10 group-hover/val:block">
                {card.fullValue}
              </span>
            </div>
          </button>
        );
      })}
    </section>
  );
}
