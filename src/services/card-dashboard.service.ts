import { createApi } from '@reduxjs/toolkit/query/react';

import {
  dashboardApiCacheOptions,
  dashboardEndpointCacheOptions,
} from '@/utils/cache-config';
import { baseQuery } from '@/utils/fetchBaseQuery';
import type {
  CardDashboardArgs,
  CardDashboardFilters,
  CardDashboardResponse,
} from '@/types/card-dashboard.type';

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

export const cardDashboardApi = createApi({
  reducerPath: 'cardDashboardApi',
  baseQuery,
  ...dashboardApiCacheOptions(),
  endpoints: (builder) => ({
    // Bir dəfə yüklənir — dropdown dəyərləri.
    getCardDashboardFilters: builder.query<CardDashboardFilters, void>({
      query: () => ({ url: 'CardDashboard/filters', method: 'GET' }),
      ...dashboardEndpointCacheOptions(),
    }),
    // KPI + trend + 4 bölgü — hamısı bir sorğuda.
    getCardDashboard: builder.query<CardDashboardResponse, CardDashboardArgs>({
      query: (args) => ({
        url: 'CardDashboard/dashboard',
        method: 'GET',
        params: cleanParams(args),
      }),
    }),
  }),
});

export const { useGetCardDashboardFiltersQuery, useGetCardDashboardQuery } =
  cardDashboardApi;
