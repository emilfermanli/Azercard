import { useShellTheme } from '@/widgets/app-shell/shell-theme-context';
import type { DonutDatum } from '../_types';
import { formatPct, mutedText, subtlePanelClass } from '../_utils';
import { ChartCard } from './chart-card';

type CashNonCashCardProps = {
  title: string;
  subtitle: string;
  data: DonutDatum[];
};

/**
 * Cash / Non-cash — iki yan-yana göstərici plitəsi (dizayndakı kimi, pie deyil).
 */
export function CashNonCashCard({ title, subtitle, data }: CashNonCashCardProps) {
  const isDark = useShellTheme();

  return (
    <ChartCard title={title} subtitle={subtitle} empty={data.length === 0}>
      <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
        {data.map((item) => (
          <div
            key={item.name}
            className={['flex flex-col rounded-xl border p-4', subtlePanelClass(isDark)].join(' ')}
          >
            <span className="flex items-center gap-2 text-sm font-semibold">
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              {item.name}
            </span>
            <span className="mt-3 text-2xl font-bold tabular-nums">{item.valueLabel}</span>
            <span className={['mt-1 text-sm font-semibold', mutedText(isDark)].join(' ')}>
              {formatPct(item.pct)}
            </span>
          </div>
        ))}
      </div>
    </ChartCard>
  );
}
