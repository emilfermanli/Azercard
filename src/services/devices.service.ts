import { createApi } from '@reduxjs/toolkit/query/react';

import { baseQuery } from '@/utils/fetchBaseQuery';
import type {
  DeviceFilters,
  DeviceFilterArgs,
  DeviceLatestMonth,
  DeviceMomItem,
  DevicePagedArgs,
  DevicePaginated,
  DeviceShareArgs,
  DeviceShareItem,
  DeviceSummaryItem,
  DeviceTotal,
  DeviceTrendArgs,
  DeviceTrendResponse,
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
    // Sağ panel — "Trend" düyməsi (tarix aralığı üzrə, ölçü seriyaları qaytarır).
    getDevicesTrend: builder.query<DeviceTrendResponse, DeviceTrendArgs>({
      query: (args) => ({
        url: 'devices/trend',
        method: 'GET',
        params: cleanParams(args),
      }),
    }),
    // Yuxarı kartlar + donut — kateqoriya üzrə bölgü (tam massiv qaytarır).
    getDevicesShare: builder.query<DeviceShareItem[], DeviceShareArgs>({
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
