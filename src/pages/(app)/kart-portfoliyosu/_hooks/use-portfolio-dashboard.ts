import { useMemo } from 'react';

import {
  useGetCardPayChartQuery,
  useGetCardTopCardsQuery,
  useGetCardTrendQuery,
  useGetCardXyChartQuery,
} from '@/services/cards.service';
import type { CardApiFilters, CardDimension, CardXyCell } from '@/types/cards.type';
import { CARD_TONES, PIE_COLORS, TREND_MONTH_COUNT } from '../_constants';
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
  /** "Bölgü" — top-cards + donut + trend `dimension`-ı. */
  cardDimension: CardDimension;
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
  cardDimension,
  xDimension,
  yDimension,
  chartOpen,
  rightPanelMode,
}: DashboardArgs): DashboardData {
  // Əvvəlki ay — kartlardakı ↑↓ ox işarəsi (mom) üçün.
  const prevMonth = snapshotMonth ? shiftMonth(snapshotMonth, -1) : undefined;

  // Yuxarı kartlar (top-cards) — seçilmiş bölgü (dimension) üzrə, tək ay.
  const { data: topData } = useGetCardTopCardsQuery(
    {
      FromMonth: snapshotMonth ?? '',
      ToMonth: snapshotMonth ?? '',
      dimension: cardDimension,
      ...apiFilters,
    },
    { skip: !snapshotMonth }
  );

  // Əvvəlki ay — eyni bölgü ilə (mom müqayisəsi).
  const { data: prevTopData } = useGetCardTopCardsQuery(
    {
      FromMonth: prevMonth ?? '',
      ToMonth: prevMonth ?? '',
      dimension: cardDimension,
      ...apiFilters,
    },
    { skip: !prevMonth }
  );

  // Donut (pay-chart) — seçilmiş bölgü üzrə; yalnız panel açıq və "Pay" rejimində.
  const { data: payData } = useGetCardPayChartQuery(
    {
      Dimension: cardDimension,
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

  // Trend — seçilmiş bölgünün ən böyük dəyəri üzrə son 6 ay (panel açıq + "Trend").
  const trendDimValue = topData?.[0]?.paymentScheme ?? '';
  const trendFrom = snapshotMonth
    ? shiftMonth(snapshotMonth, -(TREND_MONTH_COUNT - 1))
    : undefined;
  const { data: trendData } = useGetCardTrendQuery(
    {
      Dimension: cardDimension,
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

  // Cəmi — top-cards sətirlərinin kart saylarının cəmi.
  const grandTotal = useMemo(
    () => (topData ?? []).reduce((sum, item) => sum + item.totalCards, 0),
    [topData]
  );
  const totalValue = grandTotal ? formatCount(grandTotal) : '—';

  const summaryCards = useMemo<SummaryCard[]>(() => {
    const prevByLabel = new Map(
      (prevTopData ?? []).map((item) => [item.paymentScheme, item.totalCards])
    );
    return (topData ?? []).map((item, index) => {
      const prev = prevByLabel.has(item.paymentScheme)
        ? (prevByLabel.get(item.paymentScheme) as number)
        : null;
      const details: string[] = [];
      if (prev != null) {
        details.push(`Keçən ay ${formatCount(prev)}`);
        const diff = item.totalCards - prev;
        details.push(`${diff >= 0 ? '+' : ''}${formatCount(diff)}`);
      }
      const diff = prev == null ? 0 : item.totalCards - prev;
      return {
        label: item.paymentScheme,
        value: formatCount(item.totalCards),
        share: `${Math.round(item.sharePercent)}%`,
        trend: prev == null ? 'flat' : trendFromBool(diff > 0, diff === 0),
        tone: CARD_TONES[index % CARD_TONES.length],
        details,
      };
    });
  }, [topData, prevTopData]);

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
