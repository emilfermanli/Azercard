import { useMemo } from 'react';

import {
  useDeviceCategoryTotals,
  useDeviceMonthlyTotals,
  useGetDevicesShareQuery,
  useGetDevicesTotalQuery,
  useGetDevicesXyAnalysisQuery,
} from '@/services/devices.service';
import type { DeviceBaseFilters } from '@/types/devices.type';
import {
  CARD_TONES,
  MONTHS_AZ,
  PIE_COLORS,
  TREND_MONTH_COUNT,
  XY_DEFAULT_X_DIMENSION,
  XY_DEFAULT_Y_DIMENSION,
} from '../_constants';
import type { DisplayRow, PieDatum, RightPanelMode, SummaryCard, TrendDatum } from '../_types';
import { formatCount, shiftMonth, trendOf } from '../_utils';

type DashboardArgs = {
  reportMonth: string | undefined;
  prevMonth: string | undefined;
  baseFilters: DeviceBaseFilters;
  queryFilters: DeviceBaseFilters;
  retailCategories: string[];
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
};

/**
 * Kart aktivliyi səhifəsinin bütün data sorğularını idarə edir və UI üçün
 * hazır view-model qaytarır (cəmi, kartlar, donut, matris, trend).
 */
export function useDevicesDashboard({
  reportMonth,
  prevMonth,
  baseFilters,
  queryFilters,
  retailCategories,
  chartOpen,
  rightPanelMode,
}: DashboardArgs): DashboardData {
  const { data: totalData } = useGetDevicesTotalQuery(
    { reportMonth: reportMonth ?? '', ...queryFilters },
    { skip: !reportMonth }
  );

  const { data: xyData } = useGetDevicesXyAnalysisQuery(
    {
      reportMonth: reportMonth ?? '',
      xDimension: XY_DEFAULT_X_DIMENSION,
      yDimension: XY_DEFAULT_Y_DIMENSION,
      ...queryFilters,
    },
    { skip: !reportMonth }
  );

  const { data: categoryTotals } = useDeviceCategoryTotals(
    reportMonth,
    prevMonth,
    retailCategories,
    baseFilters
  );

  // Donut — /share (yalnız panel açıq və "Pay" rejimində yüklənir).
  // Hər sətirdəki sharePctByRetailCat kateqoriya üzrə eynidir, ona görə
  // bir səhifə (PageSize 100) bütün kateqoriyaları əhatə edir.
  const { data: shareData } = useGetDevicesShareQuery(
    { reportMonth: reportMonth ?? '', Page: 1, PageSize: 100, ...queryFilters },
    { skip: !reportMonth || !chartOpen || rightPanelMode !== 'share' }
  );

  // Trend qrafiki — son 6 ay (yalnız panel açıq və "Trend" rejimində yüklənir).
  const trendMonths = useMemo(
    () =>
      reportMonth
        ? Array.from({ length: TREND_MONTH_COUNT }, (_, index) =>
            shiftMonth(reportMonth, index - (TREND_MONTH_COUNT - 1))
          )
        : [],
    [reportMonth]
  );
  const { data: monthlyTotals } = useDeviceMonthlyTotals(
    trendMonths,
    queryFilters,
    !reportMonth || !chartOpen || rightPanelMode !== 'trend'
  );

  const grandTotal = totalData?.total ?? 0;
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

  // retailCategory → sharePctByRetailCat (hər kateqoriyadan ilk sətir).
  const shareByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of shareData?.items ?? []) {
      if (!map.has(item.retailCategory)) {
        map.set(item.retailCategory, item.sharePctByRetailCat);
      }
    }
    return map;
  }, [shareData]);

  const pieData = useMemo<PieDatum[]>(() => {
    const categories = retailCategories.length
      ? retailCategories
      : Array.from(shareByCategory.keys());
    return categories
      .filter((category) => shareByCategory.has(category))
      .map((category, index) => ({
        name: category,
        value: Math.round(shareByCategory.get(category) ?? 0),
        color: PIE_COLORS[index % PIE_COLORS.length],
      }));
  }, [retailCategories, shareByCategory]);

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

  const trendChartData = useMemo<TrendDatum[]>(
    () =>
      monthlyTotals.map((row) => {
        const monthIndex = Number(row.reportMonth.slice(5, 7)) - 1;
        return {
          label: `${MONTHS_AZ[monthIndex] ?? ''} ${row.reportMonth.slice(2, 4)}`,
          total: row.total,
        };
      }),
    [monthlyTotals]
  );

  return { totalValue, summaryCards, pieData, channels, matrixRows, trendChartData };
}
