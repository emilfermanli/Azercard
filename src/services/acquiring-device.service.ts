import { createApi } from '@reduxjs/toolkit/query/react';

import { baseQuery } from '@/utils/fetchBaseQuery';
import type {
  AcquiringDashboard,
  AcquiringDashboardArgs,
  AcquiringFilterOptions,
  AcquiringTrend,
  AcquiringTrendArgs,
} from '@/types/acquiring-device.type';

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

export const acquiringDeviceApi = createApi({
  reducerPath: 'acquiringDeviceApi',
  baseQuery,
  endpoints: (builder) => ({
    // Bir dəfə yüklənir — bütün dropdown dəyərləri + minDate/maxDate.
    getAcquiringFilterOptions: builder.query<AcquiringFilterOptions, void>({
      query: () => ({ url: 'AcquiringDevice/filter-options', method: 'GET' }),
    }),
    // Sağ kartlar + 1,2,3,5,6-cı qrafiklər — hamısı bir sorğuda.
    getAcquiringDashboard: builder.query<AcquiringDashboard, AcquiringDashboardArgs>({
      query: (args) => ({
        url: 'AcquiringDevice/dashboard',
        method: 'GET',
        params: cleanParams(args),
      }),
    }),
    // 4-cü qrafik — zaman trendi (+ proqnoz sahələri).
    getAcquiringTrend: builder.query<AcquiringTrend, AcquiringTrendArgs>({
      query: (args) => ({
        url: 'AcquiringDevice/trend',
        method: 'GET',
        params: cleanParams(args),
      }),
    }),
  }),
});

export const {
  useGetAcquiringFilterOptionsQuery,
  useGetAcquiringDashboardQuery,
  useGetAcquiringTrendQuery,
} = acquiringDeviceApi;
