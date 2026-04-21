import type {
  AssignRolePayload,
  GetAllUsersParams,
  GetAllUsersResult,
  RegisterUserPayload,
} from '@/types/user.type';
import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '@/utils/fetchBaseQuery';
import { mapGetAllUsersResponse } from '@/utils/map-get-all-users-response';

export const userApi = createApi({
  reducerPath: 'userApi',
  baseQuery,
  tagTypes: ['User'],
  endpoints: (builder) => ({
    getAllUsers: builder.query<GetAllUsersResult, GetAllUsersParams>({
      query: ({ pageNumber, pageSize, search }) => ({
        url: 'Auth/GetAllUsers',
        method: 'GET',
        params: {
          pageNumber,
          pageSize,
          ...(search != null && search !== '' ? { search } : {}),
        },
      }),
      transformResponse: (raw: unknown) => mapGetAllUsersResponse(raw),
      providesTags: [{ type: 'User', id: 'LIST' }],
    }),
    assignRole: builder.mutation<unknown, AssignRolePayload>({
      query: (body) => ({
        url: 'auth/assign-role',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'User', id: 'LIST' }],
    }),
    registerUser: builder.mutation<unknown, RegisterUserPayload>({
      query: (body) => ({
        url: 'auth/register',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'User', id: 'LIST' }],
    }),
  }),
});

export const { useGetAllUsersQuery, useAssignRoleMutation, useRegisterUserMutation } = userApi;
