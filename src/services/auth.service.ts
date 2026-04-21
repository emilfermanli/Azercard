import type { ResponseType } from '@/types/common.type';
import type { Auth, AuthLoginPayload } from '@/types/auth.type';
import type { CreateRolePayload, RoleRow } from '@/types/role.type';
import type { User } from '@/types/user.type';
import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '@/utils/fetchBaseQuery';
import { isAuthLoginApiResponse, mapAuthLoginApiResponseToAuth } from '@/utils/map-auth-login-response';
import { isCurrentUserApiResponse, mapCurrentUserApiToUser } from '@/utils/map-current-user-api';

function asRoleArray(raw: unknown): RoleRow[] {
  if (Array.isArray(raw)) {
    return raw as RoleRow[];
  }
  if (raw && typeof raw === 'object' && 'data' in raw && Array.isArray((raw as { data: unknown }).data)) {
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

    signOut: builder.mutation<ResponseType<null>, void>({
      query: () => ({
        method: 'POST',
        url: 'auth/logout',
      }),
    }),

    getCurrentUserData: builder.query<User, void>({
      query: () => ({
        url: 'auth/getcurrentuserdata',
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
        url: 'auth/getAllRoles',
        method: 'GET',
      }),
      transformResponse: (raw: unknown) => asRoleArray(raw),
      providesTags: [{ type: 'Role', id: 'LIST' }],
    }),

    createRole: builder.mutation<unknown, CreateRolePayload>({
      query: (body) => ({
        url: 'auth/create-role',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Role', id: 'LIST' }],
    }),
  }),
});

// Export hooks for usage in functional components, which are
// auto-generated based on the defined endpoints
export const {
  useSignOutMutation,
  useLoginMutation,
  useGetCurrentUserDataQuery,
  useGetAllRolesQuery,
  useCreateRoleMutation,
} = authApi;
