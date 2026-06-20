import { useState } from 'react';
import { Layers } from 'lucide-react';

import { useShellTheme } from '@/widgets/app-shell/shell-theme-context';
import { useGetSummaryTransactionQuery } from '@/services/summary-transaction.service';
import type { AmountScale } from '@/types/summary-transaction.type';
import { DataPageHeader, PageError, PageLoading } from '../_data-page-ui';
import { FiltersDrawer } from './_components/filters-drawer';
import { GroupCard } from './_components/group-card';
import { Toolbar } from './_components/toolbar';
import { GROUPS, SCALE_UNIT } from './_constants';
import { useSummaryFilters } from './_hooks/use-summary-filters';
import { formatAmount, formatInt, mutedText } from './_utils';

const SummaryTransactionPage: React.FC = () => {
  const isDark = useShellTheme();
  const [scale, setScale] = useState<AmountScale>(1_000_000);

  const filters = useSummaryFilters();
  const { data, isLoading, isError, isFetching } = useGetSummaryTransactionQuery({
    ...filters.apiArgs,
    Scale: scale,
  });

  const unit = SCALE_UNIT[scale];

  return (
    <div className="space-y-5 pt-2 pb-2 pl-2 pr-4 sm:pt-3 sm:pb-3 sm:pl-3 sm:pr-6">
      <FiltersDrawer filters={filters} />

      <DataPageHeader
        eyebrow="Summary transaction"
        title="Tranzaksiya xülasəsi"
        description="AZC əməliyyatlarının ümumi icmalı — issuing, daxili (inner) və acquiring qrupları üzrə qurğu (POS, ATM, Ecom, C2C, UFX) bölgüsü ilə."
        icon={Layers}
        tone="violet"
      />

      <Toolbar scale={scale} onScaleChange={setScale} />

      {isLoading ? (
        <PageLoading />
      ) : isError ? (
        <PageError />
      ) : (
        <div className={['space-y-5 transition-opacity', isFetching ? 'opacity-60' : ''].join(' ')}>
          {/* 1 — Total AZC transaction (hero) */}
          <div
            className={[
              'overflow-hidden rounded-xl border shadow-lg',
              isDark
                ? 'border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-slate-900/40'
                : 'border-amber-200 bg-gradient-to-r from-amber-50 to-white',
            ].join(' ')}
          >
            <div className="flex flex-wrap items-center justify-between gap-6 p-5">
              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-lg font-bold text-white">
                  1
                </span>
                <div>
                  <h2 className={['text-base font-semibold', isDark ? 'text-white' : 'text-slate-950'].join(' ')}>
                    Ümumi AZC əməliyyatları
                  </h2>
                  <p className={['mt-0.5 text-xs font-medium', mutedText(isDark)].join(' ')}>
                    Total AZC transaction — şərtsiz cəm
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-8">
                <div>
                  <p className={['text-[11px] font-semibold uppercase', mutedText(isDark)].join(' ')}>
                    Məbləğ
                  </p>
                  <p className="mt-0.5 text-3xl font-bold tabular-nums">
                    {formatAmount(data?.total.amount ?? 0)}{' '}
                    <span className="text-sm font-medium opacity-70">{unit}</span>
                  </p>
                </div>
                <div>
                  <p className={['text-[11px] font-semibold uppercase', mutedText(isDark)].join(' ')}>
                    Say
                  </p>
                  <p className="mt-0.5 text-3xl font-bold tabular-nums">
                    {formatInt(data?.total.count ?? 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 2, 3, 4 — qruplar */}
          <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-3">
            {GROUPS.map((g) => (
              <GroupCard
                key={g.key}
                index={g.index}
                title={g.title}
                subtitle={g.subtitle}
                accent={g.accent}
                group={data?.[g.key]}
                scale={scale}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SummaryTransactionPage;
