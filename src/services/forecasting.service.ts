import type {
  ForecastAllParams,
  ForecastParams,
  ForecastResult,
  ForecastTrainParams,
} from '@/types/forecasting.type';
import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '@/utils/fetchBaseQuery';

export const forecastingApi = createApi({
  reducerPath: 'forecastingApi',
  baseQuery,
  endpoints: (builder) => ({
    getForecast: builder.query<ForecastResult, ForecastParams | void>({
      query: (params) => ({
        url: 'Forecasting',
        method: 'GET',
        params: params || undefined,
      }),
    }),
    getAllForecasts: builder.query<ForecastResult[], ForecastAllParams | void>({
      query: (params) => ({
        url: 'Forecasting/all',
        method: 'GET',
        params: params || undefined,
      }),
    }),
    trainGlobalForecasting: builder.mutation<unknown, void>({
      query: () => ({
        url: 'Forecasting/train/global',
        method: 'POST',
      }),
    }),
    trainAllForecasting: builder.mutation<unknown, void>({
      query: () => ({
        url: 'Forecasting/train/all',
        method: 'POST',
      }),
    }),
    trainForecasting: builder.mutation<unknown, ForecastTrainParams | void>({
      query: (params) => ({
        url: 'Forecasting/train',
        method: 'POST',
        params: params || undefined,
      }),
    }),
  }),
});

export const {
  useGetForecastQuery,
  useGetAllForecastsQuery,
  useTrainGlobalForecastingMutation,
  useTrainAllForecastingMutation,
  useTrainForecastingMutation,
} = forecastingApi;
