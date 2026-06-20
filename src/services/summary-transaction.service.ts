import { createApi } from '@reduxjs/toolkit/query/react';

import { baseQuery } from '@/utils/fetchBaseQuery';
import type {
  SummaryTransactionArgs,
  SummaryTransactionResponse,
} from '@/types/summary-transaction.type';

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

export const summaryTransactionApi = createApi({
  reducerPath: 'summaryTransactionApi',
  baseQuery,
  endpoints: (builder) => ({
    // Total + issuing + inner + acquiring (hər biri qurğu bölgüsü ilə) — bir sorğuda.
    getSummaryTransaction: builder.query<
      SummaryTransactionResponse,
      SummaryTransactionArgs
    >({
      query: (args) => ({
        url: 'SummaryTransaction/summary',
        method: 'GET',
        params: cleanParams(args),
      }),
    }),
  }),
});

export const { useGetSummaryTransactionQuery } = summaryTransactionApi;
