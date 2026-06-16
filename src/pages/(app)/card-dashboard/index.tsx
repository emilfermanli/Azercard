import { useState } from 'react';

import { BreakdownDonut } from './_components/breakdown-donut';
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

      <TrendChart
        data={data.trendData}
        alerts={data.alerts}
        metricLabel={metricLabel}
        monetary={data.metricMonetary}
        roundTo={data.roundTo}
        hasForecast={data.hasForecast}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {BREAKDOWN_CHARTS.map((chart) => (
          <BreakdownDonut
            key={chart.key}
            title={chart.title}
            subtitle={chart.subtitle}
            data={data.breakdowns[chart.key]}
          />
        ))}
      </div>
    </div>
  );
};

export default CardDashboardPage;
