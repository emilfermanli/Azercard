import type { ResponseType } from '@/types/common.type';
import type { Auth, AuthLoginApiResponse, AuthLoginPayload } from '@/types/auth.type';
import type { CreateRolePayload, RoleRow } from '@/types/role.type';
import type {
  AssignRolePayload,
  RefreshTokenPayload,
  ResetPasswordPayload,
  SendResetOtpPayload,
  User,
  UserListRow,
} from '@/types/user.type';
import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '@/utils/fetchBaseQuery';
import {
  isAuthLoginApiResponse,
  mapAuthLoginApiResponseToAuth,
} from '@/utils/map-auth-login-response';
import {
  isCurrentUserApiResponse,
  mapCurrentUserApiToUser,
} from '@/utils/map-current-user-api';

function asRoleArray(raw: unknown): RoleRow[] {
  if (Array.isArray(raw)) {
    return raw as RoleRow[];
  }
  if (
    raw &&
    typeof raw === 'object' &&
    'data' in raw &&
    Array.isArray((raw as { data: unknown }).data)
  ) {
    return (raw as { data: RoleRow[] }).data;
  }
  return [];
}

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery,
  tagTypes: ['CurrentUser', 'Role'],
  endpoints: (builder) => ({
    login: builder.mutation<Auth, AuthLoginPayload>({
      query: (body) => ({
        method: 'POST',
        url: 'Auth/login',
        body: { email: body.email, password: body.password },
      }),
      transformResponse: (response: unknown, _meta, arg: AuthLoginPayload): Auth => {
        if (
          response &&
          typeof response === 'object' &&
          'data' in response &&
          (response as ResponseType<Auth>).data
        ) {
          return (response as ResponseType<Auth>).data;
        }
        if (isAuthLoginApiResponse(response)) {
          return mapAuthLoginApiResponseToAuth(response, arg.email);
        }
        return response as Auth;
      },
    }),

    signOut: builder.mutation<ResponseType<null>, RefreshTokenPayload | void>({
      query: (body) => ({
        method: 'POST',
        url: 'Auth/logout',
        body,
      }),
    }),

    refreshToken: builder.mutation<AuthLoginApiResponse, RefreshTokenPayload>({
      query: (body) => ({
        method: 'POST',
        url: 'Auth/refresh',
        body,
      }),
    }),

    getCurrentUserData: builder.query<User, void>({
      query: () => ({
        url: 'Auth/GetCurrentUserData',
        method: 'GET',
      }),
      transformResponse: (raw: unknown): User => {
        if (isCurrentUserApiResponse(raw)) {
          return mapCurrentUserApiToUser(raw);
        }
        return raw as User;
      },
      providesTags: [{ type: 'CurrentUser', id: 'ME' }],
    }),

    getAllRoles: builder.query<RoleRow[], void>({
      query: () => ({
        url: 'Auth/GetAllRoles',
        method: 'GET',
      }),
      transformResponse: (raw: unknown) => asRoleArray(raw),
      providesTags: [{ type: 'Role', id: 'LIST' }],
    }),

    createRole: builder.mutation<unknown, CreateRolePayload>({
      query: (body) => ({
        url: 'Auth/create-role',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Role', id: 'LIST' }],
    }),

    removeRole: builder.mutation<unknown, AssignRolePayload>({
      query: (body) => ({
        url: 'Auth/remove-role',
        method: 'DELETE',
        body,
      }),
      invalidatesTags: [{ type: 'Role', id: 'LIST' }],
    }),

    getUsersByRole: builder.query<UserListRow[], string>({
      query: (roleId) => ({
        url: `Auth/users/${roleId}`,
        method: 'GET',
      }),
    }),

    resetPassword: builder.mutation<unknown, ResetPasswordPayload>({
      query: (body) => ({
        url: 'Auth/ResetPassword',
        method: 'POST',
        body,
      }),
    }),

    sendResetOtp: builder.mutation<unknown, SendResetOtpPayload>({
      query: (body) => ({
        url: 'Auth/SendResetOtp',
        method: 'POST',
        body,
      }),
    }),
  }),
});

// Export hooks for usage in functional components, which are
// auto-generated based on the defined endpoints
export const {
  useSignOutMutation,
  useRefreshTokenMutation,
  useLoginMutation,
  useGetCurrentUserDataQuery,
  useGetAllRolesQuery,
  useCreateRoleMutation,
  useRemoveRoleMutation,
  useGetUsersByRoleQuery,
  useResetPasswordMutation,
  useSendResetOtpMutation,
} = authApi;
