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

export const rtkCacheDefaults = FRONTEND_CACHE_ENABLED
  ? {}
  : ({
      keepUnusedDataFor: 0,
      refetchOnMountOrArgChange: true,
    } as const);
