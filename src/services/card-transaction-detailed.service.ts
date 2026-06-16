import { createApi } from '@reduxjs/toolkit/query/react';

import { baseQuery } from '@/utils/fetchBaseQuery';
import type {
  TdBankRow,
  TdDeviceRow,
  TdSummary,
  TransactionDetailedArgs,
} from '@/types/card-transaction-detailed.type';

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

export const transactionDetailedApi = createApi({
  reducerPath: 'transactionDetailedApi',
  baseQuery,
  endpoints: (builder) => ({
    // KPI + IS_Issuing_Category bölgüsü + target bank / qurğu (seçimə görə).
    getTdSummary: builder.query<TdSummary, TransactionDetailedArgs>({
      query: (args) => ({
        url: 'TransactionDetailed/summary',
        method: 'GET',
        params: cleanParams(args),
      }),
    }),
    // SOURCE_BANK_NAME üzrə bölgü.
    getTdBanks: builder.query<TdBankRow[], TransactionDetailedArgs>({
      query: (args) => ({
        url: 'TransactionDetailed/banks',
        method: 'GET',
        params: cleanParams(args),
      }),
    }),
    // ACQUIRING_DEVICE_TYPE üzrə bölgü.
    getTdDevices: builder.query<TdDeviceRow[], TransactionDetailedArgs>({
      query: (args) => ({
        url: 'TransactionDetailed/devices',
        method: 'GET',
        params: cleanParams(args),
      }),
    }),
  }),
});

export const { useGetTdSummaryQuery, useGetTdBanksQuery, useGetTdDevicesQuery } =
  transactionDetailedApi;
