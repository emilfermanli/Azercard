import { useMemo } from 'react';

import {
  useGetAcquiringDashboardQuery,
  useGetAcquiringTrendQuery,
} from '@/services/acquiring-device.service';
import type { AcquiringApiFilters } from '@/types/acquiring-device.type';
import {
  CHART_PALETTE,
  DEVICE_COLORS,
  DEVICE_TONES,
  METRIC_API_CATEGORY,
  TREND_AGG_DIMENSION,
} from '../_constants';
import type {
  AmountUnit,
  BarDatum,
  DeviceCard,
  Metric,
  PieDatum,
  TrendDatum,
} from '../_types';
import {
  formatMetric,
  labelText,
  periodLabel,
  pickDeviceMetric,
  pickMetric,
} from '../_utils';

type DashboardArgs = {
  fromDate: string | undefined;
  toDate: string | undefined;
  apiFilters: AcquiringApiFilters;
  metric: Metric;
  amountUnit: AmountUnit;
  granularity: string;
  activeDeviceType: string | null;
};

const paletteColor = (index: number) => CHART_PALETTE[index % CHART_PALETTE.length];
const deviceColor = (type: string, index: number) =>
  DEVICE_COLORS[type] ?? paletteColor(index);

export function useAcquiringDashboard({
  fromDate,
  toDate,
  apiFilters,
  metric,
  amountUnit,
  granularity,
  activeDeviceType,
}: DashboardArgs) {
  const category = METRIC_API_CATEGORY[metric];
  const ready = Boolean(fromDate && toDate);

  const { data: dashboard, isFetching: isDashboardFetching } =
    useGetAcquiringDashboardQuery(
      {
        FromDate: fromDate ?? '',
        ToDate: toDate ?? '',
        Category: category,
        AmountUnit: amountUnit,
        ...apiFilters,
      },
      { skip: !ready }
    );

  const { data: trend, isFetching: isTrendFetching } = useGetAcquiringTrendQuery(
    {
      Dimension: TREND_AGG_DIMENSION,
      Granularity: granularity,
      FromDate: fromDate ?? '',
      ToDate: toDate ?? '',
      Category: category,
      AmountUnit: amountUnit,
      ...apiFilters,
    },
    { skip: !ready }
  );

  // Sağ rəngli qurğu kartları (deviceSummary).
  const deviceCards = useMemo<DeviceCard[]>(() => {
    const items = dashboard?.deviceSummary ?? [];
    const totalVolume = items.reduce((sum, item) => sum + item.volume, 0);
    return items.map((item, index) => ({
      type: item.deviceType,
      value: formatMetric(pickDeviceMetric(item, metric), metric, amountUnit),
      share: totalVolume ? `${Math.round((item.volume / totalVolume) * 100)}%` : '—',
      tone: DEVICE_TONES[item.deviceType] ?? 'from-slate-500 to-slate-600',
      color: deviceColor(item.deviceType, index),
      active: activeDeviceType === item.deviceType,
    }));
  }, [dashboard, metric, amountUnit, activeDeviceType]);

  // Yekun göstərici (seçilmiş kateqoriya üzrə cəm).
  const totalValue = useMemo(() => {
    const items = dashboard?.deviceSummary ?? [];
    if (!items.length) return '—';
    if (metric === 'average') {
      const volume = items.reduce((sum, item) => sum + item.volume, 0);
      const count = items.reduce((sum, item) => sum + item.count, 0);
      return formatMetric(count ? volume / count : 0, metric, amountUnit);
    }
    const total = items.reduce((sum, item) => sum + pickDeviceMetric(item, metric), 0);
    return formatMetric(total, metric, amountUnit);
  }, [dashboard, metric, amountUnit]);

  // Qrafik 1 — pay (donut), qurğu tipi üzrə.
  const pieData = useMemo<PieDatum[]>(
    () =>
      (dashboard?.pieChart ?? []).map((item, index) => ({
        name: labelText(item.label),
        value: pickMetric(item, metric),
        color: deviceColor(item.label, index),
      })),
    [dashboard, metric]
  );

  // Qrafik 2 — Trans Group.
  const transGroupData = useMemo<BarDatum[]>(
    () =>
      (dashboard?.transGroupChart ?? []).map((item, index) => ({
        label: labelText(item.transGroup),
        value: pickMetric(item, metric),
        color: paletteColor(index),
      })),
    [dashboard, metric]
  );

  // Qrafik 3 — Payment System.
  const paymentSysData = useMemo<BarDatum[]>(
    () =>
      (dashboard?.paymentSysChart ?? []).map((item, index) => ({
        label: labelText(item.paymentSystem),
        value: pickMetric(item, metric),
        color: paletteColor(index),
      })),
    [dashboard, metric]
  );

  // Qrafik 5 — Source Bank.
  const sourceBankData = useMemo<BarDatum[]>(
    () =>
      (dashboard?.sourceBankChart ?? []).map((item, index) => ({
        label: labelText(item.bankName),
        value: pickMetric(item, metric),
        color: paletteColor(index),
      })),
    [dashboard, metric]
  );

  // Qrafik 6 — Target Bank.
  const targetBankData = useMemo<BarDatum[]>(
    () =>
      (dashboard?.targetBankChart ?? []).map((item, index) => ({
        label: labelText(item.bankName),
        value: pickMetric(item, metric),
        color: paletteColor(index),
      })),
    [dashboard, metric]
  );

  // Qrafik 4 — total zaman trendi (seriyaları period üzrə cəmləyir) + proqnoz.
  const trendData = useMemo<TrendDatum[]>(() => {
    const series = trend?.series ?? [];
    if (!series.length) return [];
    type Acc = {
      actual: number;
      forecast: number;
      lower: number;
      upper: number;
      hasForecast: boolean;
    };
    const byPeriod = new Map<string, Acc>();
    for (const s of series) {
      for (const p of s.points) {
        const acc = byPeriod.get(p.period) ?? {
          actual: 0,
          forecast: 0,
          lower: 0,
          upper: 0,
          hasForecast: false,
        };
        acc.actual += p.actual;
        acc.forecast += p.forecast;
        acc.lower += p.forecastLower;
        acc.upper += p.forecastUpper;
        acc.hasForecast = acc.hasForecast || p.isForecast;
        byPeriod.set(p.period, acc);
      }
    }
    return Array.from(byPeriod.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([period, acc]) => ({
        label: periodLabel(period, granularity),
        actual: acc.hasForecast ? null : acc.actual,
        forecast: acc.hasForecast ? acc.forecast : null,
        lower: acc.hasForecast ? acc.lower : null,
        upper: acc.hasForecast ? acc.upper : null,
      }));
  }, [trend, granularity]);

  const hasForecast = useMemo(
    () => trendData.some((d) => d.forecast != null),
    [trendData]
  );

  return {
    deviceCards,
    totalValue,
    pieData,
    transGroupData,
    paymentSysData,
    sourceBankData,
    targetBankData,
    trendData,
    hasForecast,
    isFetching: isDashboardFetching || isTrendFetching,
  };
}
