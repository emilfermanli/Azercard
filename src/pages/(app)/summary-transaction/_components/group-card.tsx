import { useShellTheme } from '@/widgets/app-shell/shell-theme-context';
import type { AmountScale, SummaryGroup } from '@/types/summary-transaction.type';
import { DEVICE_ORDER, SCALE_UNIT } from '../_constants';
import { accentBadge, accentHeader, formatAmount, formatInt, mutedText, panelClass } from '../_utils';

type GroupCardProps = {
  index: number;
  title: string;
  subtitle: string;
  accent: 'blue' | 'violet' | 'emerald';
  group: SummaryGroup | undefined;
  scale: AmountScale;
};

export function GroupCard({ index, title, subtitle, accent, group, scale }: GroupCardProps) {
  const isDark = useShellTheme();
  const muted = mutedText(isDark);
  const unit = SCALE_UNIT[scale];

  // API qurğularını sabit sıraya (POS, ATM, Ecom, C2C, UFX) düzür.
  const deviceMap = new Map((group?.devices ?? []).map((d) => [d.deviceType, d]));

  return (
    <div
      className={[
        'flex h-full flex-col overflow-hidden rounded-xl border shadow-lg',
        panelClass(isDark),
      ].join(' ')}
    >
      {/* Başlıq lenti */}
      <div className={['flex items-start gap-3 p-4', accentHeader(accent, isDark)].join(' ')}>
        <span
          className={[
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold',
            accentBadge(accent),
          ].join(' ')}
        >
          {index}
        </span>
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold">{title}</h3>
          <p className="mt-0.5 text-[11px] font-medium opacity-80">{subtitle}</p>
        </div>
      </div>

      {/* Qrup cəmi */}
      <div
        className={[
          'grid grid-cols-2 gap-3 border-b px-4 py-3',
          isDark ? 'border-slate-800' : 'border-slate-200',
        ].join(' ')}
      >
        <div>
          <p className={['text-[11px] font-semibold uppercase', muted].join(' ')}>Məbləğ</p>
          <p className="mt-0.5 text-lg font-bold tabular-nums">
            {formatAmount(group?.amount ?? 0)} <span className="text-xs font-medium opacity-70">{unit}</span>
          </p>
        </div>
        <div>
          <p className={['text-[11px] font-semibold uppercase', muted].join(' ')}>Say</p>
          <p className="mt-0.5 text-lg font-bold tabular-nums">{formatInt(group?.count ?? 0)}</p>
        </div>
      </div>

      {/* Qurğu (ACQUIRING_DEVICE_TYPE) sətirləri */}
      <ul className="flex-1 divide-y divide-slate-200/60 dark:divide-slate-800/60">
        {DEVICE_ORDER.map(({ code, label }) => {
          const row = deviceMap.get(code);
          return (
            <li key={code} className="flex items-center justify-between gap-3 px-4 py-2.5">
              <span
                className={[
                  'inline-flex shrink-0 items-center rounded-md px-2 py-0.5 text-[11px] font-bold',
                  isDark ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-700',
                ].join(' ')}
              >
                {label}
              </span>
              <div className="flex items-baseline gap-4 text-right tabular-nums">
                <span className="text-sm font-semibold">
                  {formatAmount(row?.amount ?? 0)}{' '}
                  <span className={['text-[10px] font-medium', muted].join(' ')}>{unit}</span>
                </span>
                <span className={['min-w-16 text-xs', muted].join(' ')}>
                  {formatInt(row?.count ?? 0)}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
