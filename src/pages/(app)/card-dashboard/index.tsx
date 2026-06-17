import { useState } from 'react';

import { BreakdownBar } from './_components/breakdown-bar';
import { BreakdownDonut } from './_components/breakdown-donut';
import { CashNonCashCard } from './_components/cash-noncash-card';
import { DashboardToolbar } from './_components/dashboard-toolbar';
import { FiltersDrawer } from './_components/filters-drawer';
import { KpiCards } from './_components/kpi-cards';
import { TrendChart } from './_components/trend-chart';
import { BREAKDOWN_CHARTS, KPI_METRICS } from './_constants';
import { useCardDashboardData } from './_hooks/use-card-dashboard-data';
import { useCardDashboardFilters } from './_hooks/use-card-dashboard-filters';
import type { Metric } from './_types';

const CardDashboardPage: React.FC = () => {
  const [metric, setMetric] = useState<Metric>('amount');
  const [roundTo, setRoundTo] = useState(0);
  const [dateGrouping, setDateGrouping] = useState(0);

  const filters = useCardDashboardFilters();
  const data = useCardDashboardData({
    apiArgs: filters.apiArgs,
    roundTo,
    dateGrouping,
    metric,
  });

  const metricLabel = KPI_METRICS.find((m) => m.key === metric)?.label ?? '';
  const chartMeta = (key: (typeof BREAKDOWN_CHARTS)[number]['key']) =>
    BREAKDOWN_CHARTS.find((c) => c.key === key)!;
  const product = chartMeta('productBreakdown');
  const paymentSystem = chartMeta('paymentSystem');
  const paymentType = chartMeta('paymentType');
  const cashNonCash = chartMeta('cashNonCash');

  return (
    <div className="space-y-5 pt-2 pb-2 pl-2 pr-4 sm:pt-3 sm:pb-3 sm:pl-3 sm:pr-6">
      <FiltersDrawer filters={filters} />

      <KpiCards cards={data.kpiCards} onSelect={setMetric} />

      <DashboardToolbar
        roundTo={roundTo}
        onRoundToChange={setRoundTo}
        dateGrouping={dateGrouping}
        onDateGroupingChange={setDateGrouping}
      />

      {/* Sıra 1: Məhsul tipi (donut) + Trend — 50/50 */}
      <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-2">
        {/* 6 — Məhsul tipi: donut */}
        <BreakdownDonut
          title={product.title}
          subtitle={product.subtitle}
          data={data.breakdowns.productBreakdown}
        />
        {/* 5 — Artma / azalma tendensiyası: trend */}
        <TrendChart
          data={data.trendData}
          alerts={data.alerts}
          metricLabel={metricLabel}
          monetary={data.metricMonetary}
          roundTo={data.roundTo}
          hasForecast={data.hasForecast}
        />
      </div>

      {/* Sıra 2: Ödəniş sistemi + Ödəniş tipi — 50/50 */}
      <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-2">
        {/* 7 — Ödəniş sistemi: üfüqi bar */}
        <BreakdownBar
          title={paymentSystem.title}
          subtitle={paymentSystem.subtitle}
          data={data.breakdowns.paymentSystem}
        />
        {/* 8 — Ödəniş tipi: üfüqi bar */}
        <BreakdownBar
          title={paymentType.title}
          subtitle={paymentType.subtitle}
          data={data.breakdowns.paymentType}
        />
      </div>

      {/* Sıra 3: Cash / Non-cash — ortada tək */}
      <div className="lg:mx-auto lg:w-1/2">
        {/* 9 — Cash / Non-cash: iki göstərici plitəsi */}
        <CashNonCashCard
          title={cashNonCash.title}
          subtitle={cashNonCash.subtitle}
          data={data.breakdowns.cashNonCash}
        />
      </div>
    </div>
  );
};

export default CardDashboardPage;
