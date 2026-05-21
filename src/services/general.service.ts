import type { GeneralBank, GeneralMccGroup } from '@/types/general.type';
import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '@/utils/fetchBaseQuery';

export const generalApi = createApi({
  reducerPath: 'generalApi',
  baseQuery,
  endpoints: (builder) => ({
    getGeneralBanks: builder.query<GeneralBank[], void>({
      query: () => ({
        url: 'General/GetBanks',
        method: 'GET',
      }),
    }),
    getGeneralMccGroups: builder.query<GeneralMccGroup[], void>({
      query: () => ({
        url: 'General/GetMccGroups',
        method: 'GET',
      }),
    }),
  }),
});

export const { useGetGeneralBanksQuery, useGetGeneralMccGroupsQuery } = generalApi;
