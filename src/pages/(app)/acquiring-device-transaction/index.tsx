import { useState } from 'react';

import { BarChartCard } from './_components/bar-chart-card';
import { DashboardToolbar } from './_components/dashboard-toolbar';
import { DeviceCards } from './_components/device-cards';
import { FiltersDrawer } from './_components/filters-drawer';
import { ShareChart } from './_components/share-chart';
import { TrendChart } from './_components/trend-chart';
import { METRIC_OPTIONS } from './_constants';
import { useAcquiringDashboard } from './_hooks/use-acquiring-dashboard';
import { useAcquiringFilters } from './_hooks/use-acquiring-filters';
import type { AmountUnit, Metric } from './_types';

const AcquiringDeviceTransactionPage: React.FC = () => {
  const [metric, setMetric] = useState<Metric>('turnover');
  const [amountUnit, setAmountUnit] = useState<AmountUnit>('Mln');
  const [granularity, setGranularity] = useState('Month');

  const filters = useAcquiringFilters();
  const dashboard = useAcquiringDashboard({
    fromDate: filters.fromDate,
    toDate: filters.toDate,
    apiFilters: filters.apiFilters,
    metric,
    amountUnit,
    granularity,
    activeDeviceType: filters.activeDeviceType,
  });

  const metricLabel = METRIC_OPTIONS.find((m) => m.value === metric)?.label ?? '';

  return (
    <div className="space-y-5 pt-2 pb-2 pl-2 pr-4 sm:pt-3 sm:pb-3 sm:pl-3 sm:pr-6">
      <FiltersDrawer filters={filters} />

      <DashboardToolbar
        totalValue={dashboard.totalValue}
        metric={metric}
        onMetricChange={setMetric}
        amountUnit={amountUnit}
        onAmountUnitChange={setAmountUnit}
        granularity={granularity}
        onGranularityChange={setGranularity}
      />

      <div className="flex flex-col gap-4 xl:flex-row xl:items-start">
        <div className="grid min-w-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
          <ShareChart data={dashboard.pieData} metric={metric} amountUnit={amountUnit} />
          <BarChartCard
            title="Əməliyyat qrupları"
            subtitle="TRANS_GROUP üzrə bölgü"
            data={dashboard.transGroupData}
            metric={metric}
            amountUnit={amountUnit}
          />
          <BarChartCard
            title="Ödəniş sistemləri"
            subtitle="PAYMENT_SYSTEM üzrə bölgü"
            data={dashboard.paymentSysData}
            metric={metric}
            amountUnit={amountUnit}
          />
          <TrendChart
            data={dashboard.trendData}
            metric={metric}
            amountUnit={amountUnit}
            hasForecast={dashboard.hasForecast}
            className="lg:col-span-2"
          />
          <BarChartCard
            title="Source bank"
            subtitle="SOURCE_BANK_NAME üzrə bölgü"
            data={dashboard.sourceBankData}
            metric={metric}
            amountUnit={amountUnit}
          />
          <BarChartCard
            title="Target bank"
            subtitle="TARGET_BANK_NAME üzrə bölgü"
            data={dashboard.targetBankData}
            metric={metric}
            amountUnit={amountUnit}
          />
        </div>

        <div className="xl:sticky xl:top-3">
          <DeviceCards
            cards={dashboard.deviceCards}
            metricLabel={metricLabel}
            onToggle={filters.toggleDeviceType}
          />
        </div>
      </div>
    </div>
  );
};

export default AcquiringDeviceTransactionPage;
