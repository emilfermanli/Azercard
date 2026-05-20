import type {
  AzmapFilterParams,
  AzmapFilterResponse,
  AzmapHeatmapParams,
  AzmapItem,
} from '@/types/azmap.type';
import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '@/utils/fetchBaseQuery';

function toQueryDate(date: string | Date): string {
  return date instanceof Date ? date.toISOString() : date;
}

export const azmapApi = createApi({
  reducerPath: 'azmapApi',
  baseQuery,
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
    }),
    getAzmapRegions: builder.query<string[], void>({
      query: () => ({
        url: 'AzMap/regions',
        method: 'GET',
      }),
    }),
    getAzmapBanks: builder.query<string[], void>({
      query: () => ({
        url: 'AzMap/banks',
        method: 'GET',
      }),
    }),
  }),
});

export const {
  useGetAzmapFilterQuery,
  useGetAzmapHeatmapQuery,
  useGetAzmapCitiesQuery,
  useGetAzmapRegionsQuery,
  useGetAzmapBanksQuery,
} = azmapApi;
