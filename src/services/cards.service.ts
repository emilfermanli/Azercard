import { createApi } from '@reduxjs/toolkit/query/react';

import { baseQuery } from '@/utils/fetchBaseQuery';
import type {
  CardFilterOptions,
  CardPayChart,
  CardPayChartArgs,
  CardTopCardItem,
  CardTopCardsArgs,
  CardTrend,
  CardTrendArgs,
  CardXyChart,
  CardXyChartArgs,
} from '@/types/cards.type';

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

export const cardsApi = createApi({
  reducerPath: 'cardsApi',
  baseQuery,
  endpoints: (builder) => ({
    // Bir dəfə yüklənir — dropdown dəyərləri + minMonth/maxMonth.
    getCardFilterOptions: builder.query<CardFilterOptions, void>({
      query: () => ({ url: 'cards/filter-options', method: 'GET' }),
    }),
    // Yuxarı kartlar — seçilmiş ölçü (dimension) üzrə bölgü (tam massiv qaytarır).
    getCardTopCards: builder.query<CardTopCardItem[], CardTopCardsArgs>({
      query: (args) => ({
        url: 'cards/top-cards',
        method: 'GET',
        params: cleanParams(args),
      }),
    }),
    // Donut — seçilmiş ölçü üzrə pay bölgüsü.
    getCardPayChart: builder.query<CardPayChart, CardPayChartArgs>({
      query: (args) => ({
        url: 'cards/pay-chart',
        method: 'GET',
        params: cleanParams(args),
      }),
    }),
    // Matris — X×Y ölçü cədvəli.
    getCardXyChart: builder.query<CardXyChart, CardXyChartArgs>({
      query: (args) => ({
        url: 'cards/xy-chart',
        method: 'GET',
        params: cleanParams(args),
      }),
    }),
    // Trend — seçilmiş ölçü/dəyər üzrə vaxt seriyası.
    getCardTrend: builder.query<CardTrend, CardTrendArgs>({
      query: (args) => ({ url: 'cards/trend', method: 'GET', params: cleanParams(args) }),
    }),
  }),
});

export const {
  useGetCardFilterOptionsQuery,
  useGetCardTopCardsQuery,
  useGetCardPayChartQuery,
  useGetCardXyChartQuery,
  useGetCardTrendQuery,
} = cardsApi;
