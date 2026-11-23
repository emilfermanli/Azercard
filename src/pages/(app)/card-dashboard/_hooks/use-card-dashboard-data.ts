import { useEffect, useMemo } from 'react';

import { useGetCardDashboardQuery } from '@/services/card-dashboard.service';
import type {
  CardBreakdown,
  CardBreakdownItem,
  CardDashboardArgs,
  CardKpi,
  CardTrendPoint,
} from '@/types/card-dashboard.type';
import {
  ALERT_THRESHOLD_PCT,
  BREAKDOWN_CHARTS,
  DONUT_PALETTE,
  KPI_METRICS,
} from '../_constants';
import type { AlertItem, DonutDatum, KpiCard, Metric, TrendDatum } from '../_types';
import { labelText } from '../_utils';

type DataArgs = {
  apiArgs: CardDashboardArgs;
  dateGrouping: number;
  metric: Metric;
};

type BreakdownKey = (typeof BREAKDOWN_CHARTS)[number]['key'];

const isMonetary = (metric: Metric) =>
  KPI_METRICS.find((m) => m.key === metric)?.monetary ?? true;

function rawKpiValue(kpi: CardKpi, metric: Metric): number {
  if (metric === 'count') return kpi.totalTxCount;
  if (metric === 'avg') {
    return kpi.totalTxCount > 0 ? kpi.totalAmount / kpi.totalTxCount : kpi.avgAmount;
  }
  if (metric === 'max') return kpi.maxAmount;
  return kpi.totalAmount;
}

/** Bölgü elementindən aktiv göstərici üzrə xam dəyər (AZN və ya əməliyyat sayı). */
function breakdownValue(item: CardBreakdownItem, metric: Metric): number {
  if (metric === 'count') return item.totalTxCount;
  if (metric === 'avg')
    return item.totalTxCount ? item.totalAmount / item.totalTxCount : 0;
  if (metric === 'max') return item.maxAmount ?? item.totalAmount;
  return item.totalAmount;
}

function breakdownPct(item: CardBreakdownItem, metric: Metric): number {
  return metric === 'count' ? item.txCountPct : item.amountPct;
}

/** Trend nöqtəsindən aktiv göstərici üzrə faktiki xam dəyər. */
function trendActual(p: CardTrendPoint, metric: Metric): number {
  if (metric === 'count') return p.totalTxCount;
  if (metric === 'avg') return p.totalTxCount ? p.totalAmount / p.totalTxCount : 0;
  if (metric === 'max') return p.maxAmount ?? p.totalAmount;
  return p.totalAmount;
}

export function useCardDashboardData({
  apiArgs,
  dateGrouping,
  metric,
}: DataArgs) {
  // Serverdən həmişə RoundTo: 0 (xam AZN) sorğulanır; vahidə bölmə yalnız UI göstərmə anında aparılır.
  const { data, isFetching } = useGetCardDashboardQuery({
    ...apiArgs,
    RoundTo: 0,
    DateGrouping: dateGrouping as CardDashboardArgs['DateGrouping'],
  });

  useEffect(() => {
    if (import.meta.env.DEV && data) {
      console.info('[CardDashboard] Raw API data (AZN):', {
        kpi: data.kpi,
        trendCount: data.trend?.length ?? 0,
        trendSample: data.trend?.slice(0, 3),
        cashNonCash: data.cashNonCash?.items,
      });
    }
  }, [data]);

  const monetary = isMonetary(metric);

  // 4 KPI pəncərəsi — xam dəyərlərlə; seçilmiş vahidə bölmə KpiCards-da aparılır.
  const kpiCards = useMemo<KpiCard[]>(() => {
    const kpi = data?.kpi;
    return KPI_METRICS.map((m) => ({
      key: m.key,
      label: m.label,
      rawValue: kpi ? rawKpiValue(kpi, m.key) : null,
      active: m.key === metric,
      monetary: m.monetary,
    }));
  }, [data, metric]);

  // Trend (5-ci qrafik) — proqnoz yalnız amount/count üçün mövcuddur; dəyərlər xam AZN-də saxlanılır.
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

  // Bölgülər (6,7,8,9) — xam AZN/say dataları.
  const breakdowns = useMemo<Record<BreakdownKey, DonutDatum[]>>(() => {
    const build = (bd: CardBreakdown | undefined): DonutDatum[] =>
      (bd?.items ?? []).map((item, index) => ({
        name: labelText(item.category),
        value: breakdownValue(item, metric),
        pct: breakdownPct(item, metric),
        color: DONUT_PALETTE[index % DONUT_PALETTE.length],
      }));
    return {
      productBreakdown: build(data?.productBreakdown),
      paymentSystem: build(data?.paymentSystem),
      paymentType: build(data?.paymentType),
      cashNonCash: build(data?.cashNonCash),
    };
  }, [data, metric]);

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
    isFetching,
  };
}
