export function decodeJwtPayload(accessToken: string): Record<string, unknown> | null {
  const parts = accessToken.split('.');
  if (parts.length < 2 || !parts[1]) return null;
  const segment = parts[1].replace(/-/g, '+').replace(/_/g, '/');
  const pad = segment.length % 4;
  const padded = pad ? segment + '='.repeat(4 - pad) : segment;
  try {
    const json = atob(padded);
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}
