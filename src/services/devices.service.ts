import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { createApi } from '@reduxjs/toolkit/query/react';

import type { AppDispatch } from '@/store';
import { baseQuery } from '@/utils/fetchBaseQuery';
import type {
  DeviceBaseFilters,
  DeviceFilters,
  DeviceFilterArgs,
  DeviceLatestMonth,
  DeviceMomItem,
  DeviceMonthlyTotal,
  DevicePagedArgs,
  DevicePaginated,
  DeviceShareItem,
  DeviceSummaryItem,
  DeviceTotal,
  DeviceTrendArgs,
  DeviceTrendItem,
  DeviceXyArgs,
  DeviceXyItem,
} from '@/types/devices.type';

/** undefined / null / boş string parametrləri sorğudan çıxarır. */
function cleanParams<T extends Record<string, unknown>>(params: T) {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      out[key] = value;
    }
  }
  return out;
}

export const devicesApi = createApi({
  reducerPath: 'devicesApi',
  baseQuery,
  endpoints: (builder) => ({
    // Bir dəfə yüklənir — default ayı verir.
    getDevicesLatestMonth: builder.query<DeviceLatestMonth, void>({
      query: () => ({ url: 'devices/latest-month', method: 'GET' }),
    }),
    // Bir dəfə yüklənir — dropdown dəyərləri.
    getDevicesFilters: builder.query<DeviceFilters, void>({
      query: () => ({ url: 'devices/filters', method: 'GET' }),
    }),
    // "Cəmi" qutusu.
    getDevicesTotal: builder.query<DeviceTotal, DeviceFilterArgs>({
      query: (args) => ({
        url: 'devices/total',
        method: 'GET',
        params: cleanParams(args),
      }),
    }),
    // Yuxarı rəngli kartlar (granular sətirlər — səhifələnmiş, PageSize ≤ 100).
    getDevicesSummary: builder.query<DevicePaginated<DeviceSummaryItem>, DevicePagedArgs>(
      {
        query: (args) => ({
          url: 'devices/summary',
          method: 'GET',
          params: cleanParams(args),
        }),
      }
    ),
    // Kartlardakı ox işarələri (keçən ayla müqayisə).
    getDevicesMomComparison: builder.query<
      DevicePaginated<DeviceMomItem>,
      DevicePagedArgs
    >({
      query: (args) => ({
        url: 'devices/mom-comparison',
        method: 'GET',
        params: cleanParams(args),
      }),
    }),
    // Orta cədvəl — Region × Retail_Category matrisi (massiv qaytarır).
    getDevicesXyAnalysis: builder.query<DeviceXyItem[], DeviceXyArgs>({
      query: (args) => ({
        url: 'devices/xy-analysis',
        method: 'GET',
        params: cleanParams(args),
      }),
    }),
    // Sağ panel — "Trend" düyməsi (tarix aralığı üzrə).
    getDevicesTrend: builder.query<DevicePaginated<DeviceTrendItem>, DeviceTrendArgs>({
      query: (args) => ({
        url: 'devices/trend',
        method: 'GET',
        params: cleanParams(args),
      }),
    }),
    // Sağ panel — "Pay" düyməsi (donut chart).
    getDevicesShare: builder.query<DevicePaginated<DeviceShareItem>, DevicePagedArgs>({
      query: (args) => ({
        url: 'devices/share',
        method: 'GET',
        params: cleanParams(args),
      }),
    }),
  }),
});

export const {
  useGetDevicesLatestMonthQuery,
  useGetDevicesFiltersQuery,
  useGetDevicesTotalQuery,
  useGetDevicesSummaryQuery,
  useGetDevicesMomComparisonQuery,
  useGetDevicesXyAnalysisQuery,
  useGetDevicesTrendQuery,
  useGetDevicesShareQuery,
} = devicesApi;

/**
 * Trend qrafiki üçün ay üzrə cəmiləri yığır.
 *
 * `/trend` granular sətir qaytarır və `PageSize` 100-lə limitli olduğu üçün
 * aylıq cəmi xətti çıxarmaq mümkün deyil. Onun əvəzinə hər ay üçün `/total`
 * çağırılır (limitsiz, dəqiq).
 */
export function useDeviceMonthlyTotals(
  months: string[],
  filters?: DeviceBaseFilters,
  skip = false
) {
  const dispatch = useDispatch<AppDispatch>();
  const [data, setData] = useState<DeviceMonthlyTotal[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const filtersKey = JSON.stringify(filters ?? {});
  const monthsKey = months.join('|');

  useEffect(() => {
    if (skip || months.length === 0) {
      setData([]);
      return;
    }

    let active = true;
    const subscriptions: Array<{ unsubscribe: () => void }> = [];
    setIsLoading(true);

    const run = async () => {
      const results = await Promise.all(
        months.map(async (month) => {
          const request = dispatch(
            devicesApi.endpoints.getDevicesTotal.initiate({
              ...filters,
              reportMonth: month,
            })
          );
          subscriptions.push(request);
          const response = await request.unwrap().catch(() => null);
          return { reportMonth: month, total: response?.total ?? 0 };
        })
      );

      if (active) {
        setData(results);
        setIsLoading(false);
      }
    };

    run();

    return () => {
      active = false;
      subscriptions.forEach((sub) => sub.unsubscribe());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, monthsKey, filtersKey, skip]);

  return { data, isLoading };
}
