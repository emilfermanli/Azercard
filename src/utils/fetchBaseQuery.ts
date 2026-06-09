import { RootState } from '@/store';
import { fetchBaseQuery } from '@reduxjs/toolkit/query';

/**
 * Massiv query parametrlərini təkrarlanan açar kimi serialize edir
 * (`?k=a&k=b`) — ASP.NET `string[]` model-binding məhz bunu gözləyir.
 * Skalyar dəyərlər üçün davranış dəyişmir.
 */
function paramsSerializer(params: Record<string, unknown>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item !== undefined && item !== null && item !== '') {
          search.append(key, String(item));
        }
      }
    } else {
      search.append(key, String(value));
    }
  }
  return search.toString();
}

export const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_APP_API,
  paramsSerializer,
  prepareHeaders: (headers, api) => {
    const state = api.getState() as RootState;
    const auth = state.auth;

    // If we have a token set in state, let's assume that we should be passing it.
    if (auth?.data?.accessToken) {
      headers.set('authorization', `Bearer ${auth.data.accessToken}`);
    }

    return headers;
  },
});
