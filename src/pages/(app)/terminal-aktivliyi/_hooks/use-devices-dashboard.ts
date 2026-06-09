import { useMemo } from 'react';

import {
  useGetDevicesShareQuery,
  useGetDevicesTrendQuery,
  useGetDevicesXyAnalysisQuery,
} from '@/services/devices.service';
import type { DeviceBaseFilters, DeviceDimension } from '@/types/devices.type';
import { CARD_TONES, MONTHS_AZ, PIE_COLORS, TREND_MONTH_COUNT } from '../_constants';
import type {
  DisplayRow,
  PieDatum,
  RightPanelMode,
  SummaryCard,
  TrendDatum,
} from '../_types';
import { formatCount, shiftMonth, trendOf } from '../_utils';

type DashboardArgs = {
  reportMonth: string | undefined;
  prevMonth: string | undefined;
  xyDateFrom: string | undefined;
  xyDateTo: string | undefined;
  /** Matris (xy-analysis) üçün — bank/region/mcc + retailCategory. */
  queryFilters: DeviceBaseFilters;
  xDimension: DeviceDimension;
  yDimension: DeviceDimension;
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
  isMatrixLoading: boolean;
  isMatrixFetching: boolean;
};

/**
 * Kart aktivliyi səhifəsinin bütün data sorğularını idarə edir və UI üçün
 * hazır view-model qaytarır (cəmi, kartlar, donut, matris, trend).
 */
export function useDevicesDashboard({
  reportMonth,
  prevMonth,
  xyDateFrom,
  xyDateTo,
  queryFilters,
  xDimension,
  yDimension,
  chartOpen,
  rightPanelMode,
}: DashboardArgs): DashboardData {
  // Cəmi + kartlar (kateqoriya bölgüsü) — /share-dən gəlir (retail_category üzrə).
  // Qeyd: /share bank/region/mcc filtrlərini qəbul etmir — yalnız tarix üzrə.
  const { data: shareData } = useGetDevicesShareQuery(
    {
      dateFrom: reportMonth ?? '',
      dateTo: reportMonth ?? '',
      dimension: 'retail_category',
    },
    { skip: !reportMonth }
  );

  // Keçən ay — kartlardakı ↑↓ ox işarəsi (mom) üçün ikinci sorğu.
  const { data: prevShareData } = useGetDevicesShareQuery(
    {
      dateFrom: prevMonth ?? '',
      dateTo: prevMonth ?? '',
      dimension: 'retail_category',
    },
    { skip: !prevMonth }
  );

  const {
    data: xyData,
    isLoading: isMatrixLoading,
    isFetching: isMatrixFetching,
  } = useGetDevicesXyAnalysisQuery(
    {
      dateFrom: xyDateFrom ?? '',
      dateTo: xyDateTo ?? '',
      xDimension,
      yDimension,
      ...queryFilters,
    },
    { skip: !xyDateFrom || !xyDateTo }
  );

  // Kateqoriya cəmiləri — cari + keçən ay /share cavablarından birləşdirilir.
  const categoryTotals = useMemo(() => {
    const prevByCategory = new Map(
      (prevShareData ?? []).map((item) => [item.retailCategory, item.totalDevices])
    );
    return (shareData ?? []).map((item) => ({
      category: item.retailCategory,
      total: item.totalDevices,
      prevTotal: prevByCategory.has(item.retailCategory)
        ? (prevByCategory.get(item.retailCategory) as number)
        : null,
    }));
  }, [shareData, prevShareData]);

  // Trend qrafiki — son 6 ay (yalnız panel açıq və "Trend" rejimində yüklənir).
  // `/trend` tam massiv qaytarır → ay üzrə cəmi client-də yığılır.
  const trendMonths = useMemo(
    () =>
      reportMonth
        ? Array.from({ length: TREND_MONTH_COUNT }, (_, index) =>
            shiftMonth(reportMonth, index - (TREND_MONTH_COUNT - 1))
          )
        : [],
    [reportMonth]
  );
  const { data: trendData } = useGetDevicesTrendQuery(
    {
      dateFrom: trendMonths[0] ?? '',
      dateTo: trendMonths[trendMonths.length - 1] ?? '',
      dimension: 'retail_category',
    },
    { skip: !reportMonth || !chartOpen || rightPanelMode !== 'trend' }
  );

  // Cəmi — /share sətirlərinin cihaz saylarının cəmi.
  const grandTotal = useMemo(
    () => (shareData ?? []).reduce((sum, item) => sum + item.totalDevices, 0),
    [shareData]
  );
  const totalValue = grandTotal ? formatCount(grandTotal) : '—';

  const summaryCards = useMemo<SummaryCard[]>(
    () =>
      categoryTotals.map((row, index) => {
        const details: string[] = [];
        if (row.prevTotal != null) {
          details.push(`Keçən ay ${formatCount(row.prevTotal)}`);
          const diff = row.total - row.prevTotal;
          details.push(`${diff >= 0 ? '+' : ''}${formatCount(diff)}`);
        }
        return {
          label: row.category,
          value: formatCount(row.total),
          share: grandTotal ? `${Math.round((row.total / grandTotal) * 100)}%` : '—',
          trend: row.prevTotal == null ? 'flat' : trendOf(row.total - row.prevTotal),
          tone: CARD_TONES[index % CARD_TONES.length],
          details,
        };
      }),
    [categoryTotals, grandTotal]
  );

  // Donut — kateqoriya payları (/share datasından, kartlarla eyni mənbə).
  const pieData = useMemo<PieDatum[]>(() => {
    return (shareData ?? []).map((item, index) => ({
      name: item.retailCategory,
      value: grandTotal ? Math.round((item.totalDevices / grandTotal) * 100) : 0,
      color: PIE_COLORS[index % PIE_COLORS.length],
    }));
  }, [shareData, grandTotal]);

  // xy-analysis → pivot (sütun = xValue, sətir = yValue).
  const xyItems = useMemo(() => xyData ?? [], [xyData]);
  const channels = useMemo(() => {
    const seen = new Set<string>();
    const values: string[] = [];
    for (const item of xyItems) {
      if (!seen.has(item.xValue)) {
        seen.add(item.xValue);
        values.push(item.xValue);
      }
    }
    return values;
  }, [xyItems]);
  const matrixRows = useMemo<DisplayRow[]>(() => {
    const seen = new Set<string>();
    const yValues: string[] = [];
    for (const item of xyItems) {
      if (!seen.has(item.yValue)) {
        seen.add(item.yValue);
        yValues.push(item.yValue);
      }
    }
    const cellMap = new Map<string, (typeof xyItems)[number]>();
    for (const item of xyItems) {
      cellMap.set(`${item.xValue}|${item.yValue}`, item);
    }
    return yValues.map((y) => ({
      name: y,
      values: channels.map((x) => {
        const item = cellMap.get(`${x}|${y}`);
        return { amount: item?.deviceCount ?? 0, trend: trendOf(item?.momDiff) };
      }),
    }));
  }, [xyItems, channels]);

  const trendChartData = useMemo<TrendDatum[]>(() => {
    // Seriyalar kateqoriya üzrədir → hər ay üçün bütün seriyaların `count`-u yığılır.
    const totalsByMonth = new Map<string, number>();
    for (const series of trendData?.series ?? []) {
      for (const point of series.points) {
        const key = point.period.slice(0, 7); // "YYYY-MM"
        totalsByMonth.set(key, (totalsByMonth.get(key) ?? 0) + point.count);
      }
    }
    return trendMonths.map((month) => {
      const monthIndex = Number(month.slice(5, 7)) - 1;
      return {
        label: `${MONTHS_AZ[monthIndex] ?? ''} ${month.slice(2, 4)}`,
        total: totalsByMonth.get(month.slice(0, 7)) ?? 0,
      };
    });
  }, [trendData, trendMonths]);

  return {
    totalValue,
    summaryCards,
    pieData,
    channels,
    matrixRows,
    trendChartData,
    isMatrixLoading: isMatrixLoading && !xyData,
    isMatrixFetching,
  };
}
