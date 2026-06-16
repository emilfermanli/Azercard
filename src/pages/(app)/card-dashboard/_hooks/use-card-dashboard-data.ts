import { useMemo } from 'react';

import { useGetCardDashboardQuery } from '@/services/card-dashboard.service';
import type {
  CardBreakdown,
  CardBreakdownItem,
  CardDashboardArgs,
  CardTrendPoint,
} from '@/types/card-dashboard.type';
import {
  ALERT_THRESHOLD_PCT,
  BREAKDOWN_CHARTS,
  DONUT_PALETTE,
  KPI_METRICS,
} from '../_constants';
import type { AlertItem, DonutDatum, KpiCard, Metric, TrendDatum } from '../_types';
import { formatMetricValue, labelText } from '../_utils';

type DataArgs = {
  apiArgs: CardDashboardArgs;
  roundTo: number;
  dateGrouping: number;
  metric: Metric;
};

type BreakdownKey = (typeof BREAKDOWN_CHARTS)[number]['key'];

const isMonetary = (metric: Metric) =>
  KPI_METRICS.find((m) => m.key === metric)?.monetary ?? true;

/** Bölgü elementindən aktiv göstərici üzrə mütləq dəyər. */
function breakdownValue(item: CardBreakdownItem, metric: Metric): number {
  if (metric === 'count') return item.totalTxCount;
  if (metric === 'avg') return item.totalTxCount ? item.totalAmount / item.totalTxCount : 0;
  return item.totalAmount; // amount, max (max bölgü mövcud deyil → məbləğ)
}

function breakdownPct(item: CardBreakdownItem, metric: Metric): number {
  return metric === 'count' ? item.txCountPct : item.amountPct;
}

/** Trend nöqtəsindən aktiv göstərici üzrə faktiki dəyər. */
function trendActual(p: CardTrendPoint, metric: Metric): number {
  if (metric === 'count') return p.totalTxCount;
  if (metric === 'avg') return p.totalTxCount ? p.totalAmount / p.totalTxCount : 0;
  return p.totalAmount;
}

export function useCardDashboardData({
  apiArgs,
  roundTo,
  dateGrouping,
  metric,
}: DataArgs) {
  const { data, isFetching } = useGetCardDashboardQuery({
    ...apiArgs,
    RoundTo: roundTo as CardDashboardArgs['RoundTo'],
    DateGrouping: dateGrouping as CardDashboardArgs['DateGrouping'],
  });

  const monetary = isMonetary(metric);

  // 4 KPI pəncərəsi.
  const kpiCards = useMemo<KpiCard[]>(() => {
    const kpi = data?.kpi;
    return KPI_METRICS.map((m) => ({
      key: m.key,
      label: m.label,
      value: kpi ? formatMetricValue(kpi[m.kpiField], m.monetary, roundTo) : '—',
      active: m.key === metric,
      monetary: m.monetary,
    }));
  }, [data, metric, roundTo]);

  // Trend (5-ci qrafik) — proqnoz yalnız amount/count üçün mövcuddur.
  const trendData = useMemo<TrendDatum[]>(() => {
    const points = data?.trend ?? [];
    return points.map((p) => {
      let forecast: number | null = null;
      let low: number | null = null;
      let high: number | null = null;
      if (metric === 'amount') {
        forecast = p.forecastAmount;
        low = p.forecastAmountLow;
        high = p.forecastAmountHigh;
      } else if (metric === 'count') {
        forecast = p.forecastTxCount;
        low = p.forecastTxCountLow;
        high = p.forecastTxCountHigh;
      }
      return {
        label: p.periodLabel,
        actual: p.isForecast ? null : trendActual(p, metric),
        forecast: p.isForecast ? forecast : null,
        low: p.isForecast ? low : null,
        high: p.isForecast ? high : null,
        changePct: metric === 'count' ? p.txChangePct : p.amountChangePct,
      };
    });
  }, [data, metric]);

  // Alert (5-ci qrafik) — dəyişmə həddi keçən dövrlər.
  const alerts = useMemo<AlertItem[]>(() => {
    const points = data?.trend ?? [];
    return points
      .map((p) => ({
        label: p.periodLabel,
        changePct: (metric === 'count' ? p.txChangePct : p.amountChangePct) ?? 0,
      }))
      .filter((a) => Math.abs(a.changePct) >= ALERT_THRESHOLD_PCT);
  }, [data, metric]);

  // Bölgülər (6,7,8,9) — donut dataları.
  const breakdowns = useMemo<Record<BreakdownKey, DonutDatum[]>>(() => {
    const build = (bd: CardBreakdown | undefined): DonutDatum[] =>
      (bd?.items ?? []).map((item, index) => {
        const value = breakdownValue(item, metric);
        return {
          name: labelText(item.category),
          value,
          pct: breakdownPct(item, metric),
          valueLabel: formatMetricValue(value, monetary, roundTo),
          color: DONUT_PALETTE[index % DONUT_PALETTE.length],
        };
      });
    return {
      productBreakdown: build(data?.productBreakdown),
      paymentSystem: build(data?.paymentSystem),
      paymentType: build(data?.paymentType),
      cashNonCash: build(data?.cashNonCash),
    };
  }, [data, metric, monetary, roundTo]);

  const hasForecast = useMemo(
    () => trendData.some((d) => d.forecast != null),
    [trendData]
  );

  return {
    kpiCards,
    trendData,
    alerts,
    breakdowns,
    hasForecast,
    metricMonetary: monetary,
    roundTo,
    isFetching,
  };
}
