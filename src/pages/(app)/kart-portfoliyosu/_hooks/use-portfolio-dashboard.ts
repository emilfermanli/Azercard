import { useMemo } from 'react';

import {
  useGetCardPayChartQuery,
  useGetCardTopSchemesQuery,
  useGetCardTrendQuery,
  useGetCardXyChartQuery,
} from '@/services/cards.service';
import type { CardApiFilters, CardDimension, CardXyCell } from '@/types/cards.type';
import {
  CARD_TONES,
  PAY_DEFAULT_DIMENSION,
  PIE_COLORS,
  TREND_MONTH_COUNT,
} from '../_constants';
import type {
  DisplayRow,
  PieDatum,
  RightPanelMode,
  SummaryCard,
  TrendDatum,
} from '../_types';
import { formatCount, labelText, monthLabel, shiftMonth, trendFromBool } from '../_utils';

type DashboardArgs = {
  snapshotMonth: string | undefined;
  rangeFrom: string | undefined;
  rangeTo: string | undefined;
  apiFilters: CardApiFilters;
  xDimension: CardDimension;
  yDimension: CardDimension;
  chartOpen: boolean;
  rightPanelMode: RightPanelMode;
};

type DashboardData = {
  totalValue: string;
  summaryCards: SummaryCard[];
  pieData: PieDatum[];
  channels: string[];
  matrixRows: DisplayRow[];
  trendChartData: TrendDatum[];
  trendLabel: string;
  isMatrixLoading: boolean;
  isMatrixFetching: boolean;
};

export function usePortfolioDashboard({
  snapshotMonth,
  rangeFrom,
  rangeTo,
  apiFilters,
  xDimension,
  yDimension,
  chartOpen,
  rightPanelMode,
}: DashboardArgs): DashboardData {
  // Cəmi + kartlar (top-schemes) — tək ay.
  const { data: topData } = useGetCardTopSchemesQuery(
    { FromMonth: snapshotMonth ?? '', ToMonth: snapshotMonth ?? '', ...apiFilters },
    { skip: !snapshotMonth }
  );

  // Donut (pay-chart) — yalnız panel açıq və "Pay" rejimində.
  const { data: payData } = useGetCardPayChartQuery(
    {
      Dimension: PAY_DEFAULT_DIMENSION,
      FromMonth: snapshotMonth ?? '',
      ToMonth: snapshotMonth ?? '',
      ...apiFilters,
    },
    { skip: !snapshotMonth || !chartOpen || rightPanelMode !== 'share' }
  );

  // Matris (xy-chart) — tam tarix aralığı.
  const {
    data: xyData,
    isLoading: isMatrixLoading,
    isFetching: isMatrixFetching,
  } = useGetCardXyChartQuery(
    {
      XDimension: xDimension,
      YDimension: yDimension,
      FromMonth: rangeFrom ?? '',
      ToMonth: rangeTo ?? '',
      ...apiFilters,
    },
    { skip: !rangeFrom || !rangeTo }
  );

  // Trend — ən böyük ödəniş sistemi üzrə son 6 ay (panel açıq + "Trend" rejimi).
  const trendDimValue = topData?.schemes?.[0]?.paymentScheme ?? '';
  const trendFrom = snapshotMonth
    ? shiftMonth(snapshotMonth, -(TREND_MONTH_COUNT - 1))
    : undefined;
  const { data: trendData } = useGetCardTrendQuery(
    {
      Dimension: 'payment_scheme',
      DimValues: trendDimValue ? [trendDimValue] : [],
      Granularity: 'month',
      FromMonth: trendFrom ?? '',
      ToMonth: snapshotMonth ?? '',
      ...apiFilters,
    },
    {
      skip:
        !snapshotMonth ||
        !trendFrom ||
        !trendDimValue ||
        !chartOpen ||
        rightPanelMode !== 'trend',
    }
  );

  const grandTotal = topData?.grandTotal ?? 0;
  const totalValue = grandTotal ? formatCount(grandTotal) : '—';

  const summaryCards = useMemo<SummaryCard[]>(
    () =>
      (topData?.schemes ?? []).map((scheme, index) => ({
        label: scheme.paymentScheme,
        value: formatCount(scheme.totalCards),
        share: `${Math.round(scheme.sharePercent)}%`,
        trend: trendFromBool(scheme.momIsUp, scheme.momChange === 0),
        tone: CARD_TONES[index % CARD_TONES.length],
        details: [
          `Əmək ${formatCount(scheme.salary)}`,
          `Kredit ${formatCount(scheme.credit)}`,
          `Sosial ${formatCount(scheme.social)}`,
          `Digər ${formatCount(scheme.other)}`,
        ],
      })),
    [topData]
  );

  const pieData = useMemo<PieDatum[]>(
    () =>
      (payData?.items ?? []).map((item, index) => ({
        name: labelText(item.label),
        value: Math.round(item.percent),
        color: PIE_COLORS[index % PIE_COLORS.length],
      })),
    [payData]
  );

  // xy-chart → matris (sütun = xLabels, sətir = yLabels).
  const channels = useMemo(
    () => (xyData?.xLabels ?? []).map(labelText),
    [xyData]
  );
  const matrixRows = useMemo<DisplayRow[]>(() => {
    if (!xyData) return [];
    const cellByKey = new Map<string, CardXyCell>();
    for (const cell of xyData.cells) {
      cellByKey.set(`${labelText(cell.xLabel)}|${labelText(cell.yLabel)}`, cell);
    }
    return xyData.yLabels.map((rawY) => {
      const y = labelText(rawY);
      return {
        name: y,
        values: channels.map((x) => {
          const cell = cellByKey.get(`${x}|${y}`);
          return { amount: cell?.count ?? 0, trend: trendFromBool(cell?.momIsUp) };
        }),
      };
    });
  }, [xyData, channels]);

  const trendChartData = useMemo<TrendDatum[]>(
    () =>
      (trendData?.series?.[0]?.points ?? []).map((point) => ({
        label: monthLabel(point.period),
        total: point.count,
      })),
    [trendData]
  );

  return {
    totalValue,
    summaryCards,
    pieData,
    channels,
    matrixRows,
    trendChartData,
    trendLabel: trendDimValue,
    isMatrixLoading: isMatrixLoading && !xyData,
    isMatrixFetching,
  };
}
