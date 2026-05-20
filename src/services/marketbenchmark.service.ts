import type {
  MarketBenchmarkBankTrendItem,
  MarketBenchmarkBankTrendParams,
  MarketBenchmarkFilterParams,
  MarketBenchmarkPaginatedResponse,
  MarketBenchmarkRankedParams,
} from '@/types/marketbenchmark.type';
import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '@/utils/fetchBaseQuery';

function toQueryDate(date: string | Date): string {
  return date instanceof Date ? date.toISOString() : date;
}

export const marketbenchmarkApi = createApi({
  reducerPath: 'marketbenchmarkApi',
  baseQuery,
  endpoints: (builder) => ({
    getMarketbenchmarkRanked: builder.query<
      MarketBenchmarkPaginatedResponse,
      MarketBenchmarkRankedParams
    >({
      query: ({ month, Page, PageSize, regionNameClean }) => ({
        url: 'MarketBenchmark/ranked',
        method: 'GET',
        params: {
          month: toQueryDate(month),
          Page,
          PageSize,
          regionNameClean,
        },
      }),
    }),
    getMarketbenchmarkFilter: builder.query<
      MarketBenchmarkPaginatedResponse,
      MarketBenchmarkFilterParams
    >({
      query: ({ ReportMonth, ...rest }) => ({
        url: 'MarketBenchmark/filter',
        method: 'GET',
        params: {
          ...rest,
          ...(ReportMonth != null ? { ReportMonth: toQueryDate(ReportMonth) } : {}),
        },
      }),
    }),
    getMarketbenchmarkBankTrend: builder.query<
      MarketBenchmarkBankTrendItem[],
      MarketBenchmarkBankTrendParams
    >({
      query: ({ bankName }) => ({
        url: `MarketBenchmark/bank/${encodeURIComponent(bankName)}/trend`,
        method: 'GET',
      }),
    }),
  }),
});

export const {
  useGetMarketbenchmarkRankedQuery,
  useGetMarketbenchmarkFilterQuery,
  useGetMarketbenchmarkBankTrendQuery,
} = marketbenchmarkApi;
