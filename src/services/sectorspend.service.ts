import type {
  SectorSpendChannelDistributionParams,
  SectorSpendChannelDistributionResponse,
  SectorSpendFilterParams,
  SectorSpendItem,
  SectorSpendPaginatedResponse,
  SectorSpendTopMccParams,
  SectorSpendTrendItem,
  SectorSpendTrendParams,
} from '@/types/sectorspend.type';
import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '@/utils/fetchBaseQuery';

function toQueryDate(date: string | Date): string {
  return date instanceof Date ? date.toISOString() : date;
}

export const sectorspendApi = createApi({
  reducerPath: 'sectorspendApi',
  baseQuery,
  endpoints: (builder) => ({
    getSectorSpendFilter: builder.query<
      SectorSpendPaginatedResponse,
      SectorSpendFilterParams
    >({
      query: ({ month, ...params }) => ({
        url: 'SectorSpend/filter',
        method: 'GET',
        params: {
          ...params,
          ...(month != null ? { month: toQueryDate(month) } : {}),
        },
      }),
    }),
    getSectorSpendTopMcc: builder.query<SectorSpendItem[], SectorSpendTopMccParams>({
      query: ({ bankName, month, topN = 10 }) => ({
        url: `SectorSpend/bank/${encodeURIComponent(bankName)}/top-mcc`,
        method: 'GET',
        params: {
          month: toQueryDate(month),
          topN,
        },
      }),
    }),
    getSectorSpendTrend: builder.query<SectorSpendTrendItem[], SectorSpendTrendParams>({
      query: ({ bankName, mccGroup }) => ({
        url: `SectorSpend/bank/${encodeURIComponent(bankName)}/trend`,
        method: 'GET',
        params: {
          mccGroup,
        },
      }),
    }),
    getSectorSpendChannelDistribution: builder.query<
      SectorSpendChannelDistributionResponse,
      SectorSpendChannelDistributionParams
    >({
      query: ({ bankName, month }) => ({
        url: `SectorSpend/bank/${encodeURIComponent(bankName)}/channel-distribution`,
        method: 'GET',
        params: {
          month: toQueryDate(month),
        },
      }),
    }),
  }),
});

export const {
  useGetSectorSpendFilterQuery,
  useGetSectorSpendTopMccQuery,
  useGetSectorSpendTrendQuery,
  useGetSectorSpendChannelDistributionQuery,
} = sectorspendApi;
