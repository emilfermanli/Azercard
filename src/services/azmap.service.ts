import type {
  AzmapFilterOptionsResponse,
  AzmapFilterParams,
  AzmapFilterResponse,
  AzmapHeatmapParams,
  AzmapItem,
} from '@/types/azmap.type';
import { createApi } from '@reduxjs/toolkit/query/react';
import {
  dashboardApiCacheOptions,
  dashboardEndpointCacheOptions,
} from '@/utils/cache-config';
import { baseQuery } from '@/utils/fetchBaseQuery';

function toQueryDate(date: string | Date): string {
  return date instanceof Date ? date.toISOString() : date;
}

export const azmapApi = createApi({
  reducerPath: 'azmapApi',
  baseQuery,
  ...dashboardApiCacheOptions(),
  endpoints: (builder) => ({
    getAzmapFilter: builder.query<AzmapFilterResponse, AzmapFilterParams | void>({
      query: (params) => ({
        url: 'AzMap/filter',
        method: 'GET',
        params: params
          ? {
              ...params,
              ...(params.ReportMonth != null
                ? { ReportMonth: toQueryDate(params.ReportMonth) }
                : {}),
              ...(params.StartDate != null
                ? { StartDate: toQueryDate(params.StartDate) }
                : {}),
              ...(params.EndDate != null
                ? { EndDate: toQueryDate(params.EndDate) }
                : {}),
            }
          : undefined,
      }),
    }),
    getAzmapHeatmap: builder.query<AzmapItem[], AzmapHeatmapParams | void>({
      query: (params) => ({
        url: 'AzMap/heatmap',
        method: 'GET',
        params: params
          ? {
              ...params,
              ...(params.month != null ? { month: toQueryDate(params.month) } : {}),
            }
          : undefined,
      }),
    }),
    getAzmapCities: builder.query<string[], void>({
      query: () => ({
        url: 'AzMap/cities',
        method: 'GET',
      }),
      ...dashboardEndpointCacheOptions(),
    }),
    getAzmapRegions: builder.query<string[], void>({
      query: () => ({
        url: 'AzMap/regions',
        method: 'GET',
      }),
      ...dashboardEndpointCacheOptions(),
    }),
    getAzmapBanks: builder.query<string[], void>({
      query: () => ({
        url: 'AzMap/banks',
        method: 'GET',
      }),
      ...dashboardEndpointCacheOptions(),
    }),
    getAzmapFilterOptions: builder.query<AzmapFilterOptionsResponse, void>({
      query: () => ({
        url: 'AzMap/filter-options',
        method: 'GET',
      }),
      ...dashboardEndpointCacheOptions(),
    }),
  }),
});

export const {
  useGetAzmapFilterQuery,
  useGetAzmapHeatmapQuery,
  useGetAzmapCitiesQuery,
  useGetAzmapRegionsQuery,
  useGetAzmapBanksQuery,
  useGetAzmapFilterOptionsQuery,
} = azmapApi;
