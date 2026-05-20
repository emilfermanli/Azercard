import type {
  CreateDepartmentPayload,
  CreatePositionPayload,
  Department,
  Position,
  UpdateDepartmentPayload,
  UpdatePositionPayload,
} from '@/types/organization.type';
import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from '@/utils/fetchBaseQuery';

function asArray<T>(raw: unknown): T[] {
  return Array.isArray(raw) ? (raw as T[]) : [];
}

export const organizationApi = createApi({
  reducerPath: 'organizationApi',
  baseQuery,
  tagTypes: ['Department', 'Position'],
  endpoints: (builder) => ({
    getDepartments: builder.query<Department[], void>({
      query: () => ({ url: 'Department', method: 'GET' }),
      transformResponse: (raw: unknown) => asArray<Department>(raw),
      providesTags: [{ type: 'Department', id: 'LIST' }],
    }),
    createDepartment: builder.mutation<Department, CreateDepartmentPayload>({
      query: (body) => ({
        url: 'Department',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Department', id: 'LIST' }],
    }),
    getDepartmentById: builder.query<Department, string>({
      query: (id) => ({ url: `Department/${id}`, method: 'GET' }),
      providesTags: (_result, _error, id) => [{ type: 'Department', id }],
    }),
    updateDepartment: builder.mutation<Department, UpdateDepartmentPayload>({
      query: (body) => ({
        url: 'Department/Update',
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: 'Department', id: 'LIST' },
        { type: 'Department', id: arg.id },
      ],
    }),
    deleteDepartment: builder.mutation<void, string>({
      query: (id) => ({ url: `Department/${id}`, method: 'DELETE' }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Department', id: 'LIST' },
        { type: 'Department', id },
      ],
    }),
    getPositions: builder.query<Position[], void>({
      query: () => ({ url: 'Position', method: 'GET' }),
      transformResponse: (raw: unknown) => asArray<Position>(raw),
      providesTags: [{ type: 'Position', id: 'LIST' }],
    }),
    createPosition: builder.mutation<Position, CreatePositionPayload>({
      query: (body) => ({
        url: 'Position',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Position', id: 'LIST' }],
    }),
    getPositionById: builder.query<Position, string>({
      query: (id) => ({ url: `Position/${id}`, method: 'GET' }),
      providesTags: (_result, _error, id) => [{ type: 'Position', id }],
    }),
    updatePosition: builder.mutation<Position, UpdatePositionPayload>({
      query: (body) => ({
        url: 'Position/Update',
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: 'Position', id: 'LIST' },
        { type: 'Position', id: arg.id },
      ],
    }),
    deletePosition: builder.mutation<void, string>({
      query: (id) => ({ url: `Position/${id}`, method: 'DELETE' }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Position', id: 'LIST' },
        { type: 'Position', id },
      ],
    }),
  }),
});

export const {
  useGetDepartmentsQuery,
  useGetDepartmentByIdQuery,
  useGetPositionsQuery,
  useGetPositionByIdQuery,
  useCreateDepartmentMutation,
  useUpdateDepartmentMutation,
  useDeleteDepartmentMutation,
  useCreatePositionMutation,
  useUpdatePositionMutation,
  useDeletePositionMutation,
} = organizationApi;
