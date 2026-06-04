import { useState } from 'react';
import { PanelRightOpen } from 'lucide-react';

import { useShellTheme } from '@/widgets/app-shell/shell-theme-context';
import { AnalysisSection } from './_components/analysis-section';
import { DistributionPanel } from './_components/distribution-panel';
import { FiltersDrawer } from './_components/filters-drawer';
import { SummaryCarousel } from './_components/summary-carousel';
import { TotalCard } from './_components/total-card';
import { useCardCarousel } from './_hooks/use-card-carousel';
import { useChartPanel } from './_hooks/use-chart-panel';
import { useDeviceFilters } from './_hooks/use-device-filters';
import { useDevicesDashboard } from './_hooks/use-devices-dashboard';
import type { RightPanelMode } from './_types';

const CardActivityPage: React.FC = () => {
  const isDark = useShellTheme();
  const [rightPanelMode, setRightPanelMode] = useState<RightPanelMode>('share');

  const filters = useDeviceFilters();
  const chart = useChartPanel();
  const dashboard = useDevicesDashboard({
    reportMonth: filters.reportMonth,
    prevMonth: filters.prevMonth,
    baseFilters: filters.baseFilters,
    queryFilters: filters.queryFilters,
    retailCategories: filters.retailCategories,
    chartOpen: chart.chartOpen,
    rightPanelMode,
  });
  const carousel = useCardCarousel(dashboard.summaryCards.length);

  return (
    <div className="space-y-5 pt-2 pb-2 pl-2 pr-4 sm:pt-3 sm:pb-3 sm:pl-3 sm:pr-6">
      <FiltersDrawer filters={filters} />

      <TotalCard value={dashboard.totalValue} />

      <SummaryCarousel
        cards={dashboard.summaryCards}
        emblaRef={carousel.emblaRef}
        onPrev={carousel.scrollPrev}
        onNext={carousel.scrollNext}
      />

      <div
        ref={chart.splitContainerRef}
        className="flex flex-col gap-4 xl:flex-row xl:flex-wrap xl:items-stretch"
      >
        <AnalysisSection
          channels={dashboard.channels}
          matrixRows={dashboard.matrixRows}
          style={{ flex: chart.chartOpen && chart.chartStacked ? '1 1 100%' : '1 1 0%' }}
        />

        {!chart.chartOpen && (
          <button
            type="button"
            onClick={chart.openChart}
            className={[
              'flex min-h-14 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-bold shadow-lg transition xl:w-14 xl:shrink-0 xl:[writing-mode:vertical-rl]',
              isDark
                ? 'border-blue-500/40 bg-blue-500/15 text-blue-200 hover:bg-blue-500/25 hover:text-white'
                : 'border-blue-200 bg-white text-blue-700 hover:bg-blue-50',
            ].join(' ')}
            aria-label="Pay bölgüsünü göstər"
            title="Pay bölgüsünü göstər"
          >
            <PanelRightOpen className="h-4 w-4 xl:-rotate-90" />
            Pay bölgüsü
          </button>
        )}

        {chart.chartOpen && (
          <button
            type="button"
            onPointerDown={chart.handleSplitterPointerDown}
            className={[
              'hidden w-3 shrink-0 cursor-col-resize rounded-full border transition xl:flex xl:items-center xl:justify-center',
              chart.chartStacked ? 'xl:hidden' : '',
              isDark
                ? 'border-slate-700 bg-slate-800/80 hover:bg-blue-600'
                : 'border-slate-200 bg-white hover:bg-blue-100',
            ].join(' ')}
            aria-label="Cədvəl və qrafik ölçüsünü dəyiş"
          >
            <span
              className={['h-12 w-1 rounded-full', isDark ? 'bg-slate-500' : 'bg-slate-300'].join(' ')}
            />
          </button>
        )}

        {chart.chartOpen && (
          <DistributionPanel
            mode={rightPanelMode}
            onModeChange={setRightPanelMode}
            stacked={chart.chartStacked}
            onUnstack={chart.unstack}
            onClose={chart.closeChart}
            pieData={dashboard.pieData}
            trendChartData={dashboard.trendChartData}
            style={{ flex: chart.chartStacked ? '1 1 100%' : `0 0 ${chart.chartWidth}px` }}
          />
        )}
      </div>
    </div>
  );
};

export default CardActivityPage;
