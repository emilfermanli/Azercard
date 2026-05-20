import type {
  WorldmapFilterParams,
  WorldmapHeatmapParams,
  WorldmapHeatmapResponse,
  WorldmapPaginatedResponse,
} from '@/types/worldmap.type';
import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '@/utils/fetchBaseQuery';

function toQueryDate(date: string | Date): string {
  return date instanceof Date ? date.toISOString() : date;
}

export const worldmapApi = createApi({
  reducerPath: 'worldmapApi',
  baseQuery,
  endpoints: (builder) => ({
    getWorldmapFilter: builder.query<
      WorldmapPaginatedResponse,
      WorldmapFilterParams | void
    >({
      query: (params) => ({
        url: 'WorldMap/filter',
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
    getWorldmapHeatmap: builder.query<
      WorldmapHeatmapResponse,
      WorldmapHeatmapParams | void
    >({
      query: (params) => ({
        url: 'WorldMap/heatmap',
        method: 'GET',
        params: params
          ? {
              bankName: params.bankName,
              ...(params.month != null ? { month: toQueryDate(params.month) } : {}),
            }
          : undefined,
      }),
    }),
  }),
});

export const { useGetWorldmapFilterQuery, useGetWorldmapHeatmapQuery } = worldmapApi;
