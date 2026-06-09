import { useMemo } from 'react';

import {
  useGetDevicesShareQuery,
  useGetDevicesTrendQuery,
  useGetDevicesXyAnalysisQuery,
} from '@/services/devices.service';
import type { DeviceBaseFilters, DeviceDimension } from '@/types/devices.type';
import {
  CARD_TONES,
  MONTHS_AZ,
  PIE_COLORS,
  SHARE_DIMENSION_API,
  type ShareDimensionValue,
} from '../_constants';
import type {
  DisplayRow,
  PieDatum,
  RightPanelMode,
  SummaryCard,
  TrendDatum,
} from '../_types';
import { formatCount, shiftMonth, trendOf } from '../_utils';

type DashboardArgs = {
  xyDateFrom: string | undefined;
  xyDateTo: string | undefined;
  /** share + xy-analysis üçün — bank/region/mcc + retailCategory. */
  queryFilters: DeviceBaseFilters;
  /** share endpointinin "Bölgü"sü (dimension). */
  shareDimension: ShareDimensionValue;
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
  xyDateFrom,
  xyDateTo,
  queryFilters,
  shareDimension,
  xDimension,
  yDimension,
  chartOpen,
  rightPanelMode,
}: DashboardArgs): DashboardData {
  // share endpointinin `dimension`-ı (UI camelCase → API snake_case).
  const dimension = SHARE_DIMENSION_API[shareDimension];

  // Əvvəlki bərabər uzunluqlu dövr (kartlardakı ↑↓ müqayisəsi üçün).
  const prevRange = useMemo(() => {
    if (!xyDateFrom || !xyDateTo) return null;
    const fromYM = xyDateFrom.slice(0, 7); // "YYYY-MM"
    const toYM = xyDateTo.slice(0, 7);
    const [fromYear, fromMonth] = fromYM.split('-').map(Number);
    const [toYear, toMonth] = toYM.split('-').map(Number);
    const count = (toYear - fromYear) * 12 + (toMonth - fromMonth) + 1;
    if (count < 1) return null;
    const fromFirst = `${fromYM}-01T00:00:00`;
    return { from: shiftMonth(fromFirst, -count), to: shiftMonth(fromFirst, -1) };
  }, [xyDateFrom, xyDateTo]);

  // Cəmi + kartlar — /share (seçilmiş tarix aralığı + filtrlər + bölgü).
  const { data: shareData } = useGetDevicesShareQuery(
    {
      dateFrom: xyDateFrom ?? '',
      dateTo: xyDateTo ?? '',
      dimension,
      ...queryFilters,
    },
    { skip: !xyDateFrom || !xyDateTo }
  );

  // Əvvəlki dövr — kartlardakı ↑↓ ox işarəsi (mom) üçün ikinci sorğu.
  const { data: prevShareData } = useGetDevicesShareQuery(
    {
      dateFrom: prevRange?.from ?? '',
      dateTo: prevRange?.to ?? '',
      dimension,
      ...queryFilters,
    },
    { skip: !prevRange }
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
      (prevShareData ?? []).map((item) => [item.dimensionValue, item.totalDevices])
    );
    return (shareData ?? []).map((item) => ({
      category: item.dimensionValue,
      total: item.totalDevices,
      prevTotal: prevByCategory.has(item.dimensionValue)
        ? (prevByCategory.get(item.dimensionValue) as number)
        : null,
    }));
  }, [shareData, prevShareData]);

  // Trend qrafiki — filterdə seçilmiş tarix aralığı (başlanğıc → son).
  // `/trend` ay üzrə seriyalar qaytarır → hər ay üçün cəmi client-də yığılır.
  const trendMonths = useMemo(() => {
    if (!xyDateFrom || !xyDateTo) return [];
    const fromYM = xyDateFrom.slice(0, 7); // "YYYY-MM"
    const toYM = xyDateTo.slice(0, 7);
    const [fromYear, fromMonth] = fromYM.split('-').map(Number);
    const [toYear, toMonth] = toYM.split('-').map(Number);
    const count = (toYear - fromYear) * 12 + (toMonth - fromMonth) + 1;
    if (count < 1) return [];
    const start = `${fromYM}-01T00:00:00`;
    return Array.from({ length: count }, (_, index) => shiftMonth(start, index));
  }, [xyDateFrom, xyDateTo]);

  const { data: trendData } = useGetDevicesTrendQuery(
    {
      dateFrom: xyDateFrom ?? '',
      dateTo: xyDateTo ?? '',
      dimension: 'retail_category',
    },
    { skip: !xyDateFrom || !xyDateTo || !chartOpen || rightPanelMode !== 'trend' }
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
      name: item.dimensionValue,
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
