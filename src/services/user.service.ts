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
      query: ({ pageNumber, pageSize, search, role, departmentId, positionId }) => ({
        url: 'Auth/GetAllUsers',
        method: 'GET',
        params: {
          PageNumber: pageNumber,
          PageSize: pageSize,
          ...(role != null && role !== '' ? { Role: role } : {}),
          ...(departmentId != null && departmentId !== ''
            ? { DepartmentId: departmentId }
            : {}),
          ...(positionId != null && positionId !== '' ? { PositionId: positionId } : {}),
          ...(search != null && search !== '' ? { Search: search } : {}),
        },
      }),
      transformResponse: (raw: unknown) => mapGetAllUsersResponse(raw),
      providesTags: [{ type: 'User', id: 'LIST' }],
    }),
    assignRole: builder.mutation<unknown, AssignRolePayload>({
      query: (body) => ({
        url: 'Auth/assign-role',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'User', id: 'LIST' }],
    }),
    registerUser: builder.mutation<unknown, RegisterUserPayload>({
      query: (body) => ({
        url: 'Auth/register',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'User', id: 'LIST' }],
    }),
  }),
});

export const { useGetAllUsersQuery, useAssignRoleMutation, useRegisterUserMutation } =
  userApi;
