import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { EmblaViewportRefType } from 'embla-carousel-react';

import { useShellTheme } from '@/widgets/app-shell/shell-theme-context';
import type { SummaryCard } from '../_types';
import { trendClasses } from '../_utils';
import { TrendIcon } from './trend-indicator';

type SummaryCarouselProps = {
  cards: SummaryCard[];
  emblaRef: EmblaViewportRefType;
  onPrev: () => void;
  onNext: () => void;
};

function CarouselCard({ card }: { card: SummaryCard }) {
  return (
    <article
      className={[
        'flex h-full min-h-[9.75rem] flex-col rounded-xl border border-white/10 bg-gradient-to-br p-4 text-white shadow-lg',
        card.tone,
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-2xl font-bold tabular-nums">{card.value}</p>
          <span
            title={card.label}
            className="mt-3 inline-block max-w-full min-w-20 truncate rounded-md border border-white/50 px-3 py-1 text-center text-xs font-bold align-middle"
          >
            {card.label}
          </span>
        </div>
        <div
          className={[
            'mt-12 flex shrink-0 items-center gap-1 text-lg font-bold',
            trendClasses(card.trend),
          ].join(' ')}
        >
          <TrendIcon trend={card.trend} />
          <span className="text-white">{card.share}</span>
        </div>
      </div>
      <div className="mt-7 flex flex-wrap gap-x-4 gap-y-1 text-xs font-bold">
        {card.details.map((detail) => (
          <span key={detail}>{detail}</span>
        ))}
      </div>
    </article>
  );
}

export function SummaryCarousel({
  cards,
  emblaRef,
  onPrev,
  onNext,
}: SummaryCarouselProps) {
  const isDark = useShellTheme();
  const navButtonClass = [
    'flex h-9 w-9 items-center justify-center rounded-full border transition',
    isDark
      ? 'border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-700 hover:text-white'
      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-950',
  ].join(' ');

  return (
    <section className="space-y-3">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex -ml-3">
          {cards.map((card) => (
            <div
              key={card.label}
              className="min-w-0 shrink-0 grow-0 basis-full pl-3 sm:basis-1/2 lg:basis-1/3 xl:basis-1/4"
            >
              <CarouselCard card={card} />
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={onPrev}
          className={navButtonClass}
          aria-label="Əvvəlki kart"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onNext}
          className={navButtonClass}
          aria-label="Növbəti kart"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}
