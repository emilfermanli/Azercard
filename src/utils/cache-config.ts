function parseBooleanFlag(value: unknown, fallback: boolean): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const norm = value.trim().toLowerCase();
    if (norm === 'false' || norm === '0' || norm === 'off' || norm === 'no') {
      return false;
    }
    if (norm === 'true' || norm === '1' || norm === 'on' || norm === 'yes') {
      return true;
    }
  }
  return fallback;
}

export function isFrontendCacheEnabled(): boolean {
  if (typeof window !== 'undefined' && window.__APP_CONFIG__?.cacheEnabled !== undefined) {
    return parseBooleanFlag(window.__APP_CONFIG__.cacheEnabled, true);
  }
  return parseBooleanFlag(import.meta.env.VITE_CACHE_ENABLED, true);
}

export const FRONTEND_CACHE_ENABLED = isFrontendCacheEnabled();

export const DASHBOARD_DATA_CACHE_SECONDS = 300;
export const DASHBOARD_LOOKUP_CACHE_SECONDS = 1800;

export const rtkCacheDefaults = FRONTEND_CACHE_ENABLED
  ? {}
  : ({
      keepUnusedDataFor: 0,
      refetchOnMountOrArgChange: true,
    } as const);

export function dashboardApiCacheOptions(seconds = DASHBOARD_DATA_CACHE_SECONDS) {
  return FRONTEND_CACHE_ENABLED
    ? ({ keepUnusedDataFor: seconds } as const)
    : ({
        keepUnusedDataFor: 0,
        refetchOnMountOrArgChange: true,
      } as const);
}

export function dashboardEndpointCacheOptions(seconds = DASHBOARD_LOOKUP_CACHE_SECONDS) {
  return FRONTEND_CACHE_ENABLED
    ? ({ keepUnusedDataFor: seconds } as const)
    : ({ keepUnusedDataFor: 0 } as const);
}
