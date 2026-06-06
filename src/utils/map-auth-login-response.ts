import type { Auth, AuthLoginApiResponse } from '@/types/auth.type';
import type { User } from '@/types/user.type';
import { decodeJwtPayload } from '@/utils/jwt-decode';

const CLAIM_NAME_ID =
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier';
const CLAIM_EMAIL = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress';
const CLAIM_ROLE = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';

function stablePositiveIntFromString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h) || 1;
}

function pickString(payload: Record<string, unknown>, key: string): string | undefined {
  const v = payload[key];
  return typeof v === 'string' ? v : undefined;
}

function pickRole(payload: Record<string, unknown>): string {
  const raw = payload[CLAIM_ROLE];
  if (typeof raw === 'string' && raw.trim()) return raw.trim();
  if (Array.isArray(raw) && raw.length > 0 && typeof raw[0] === 'string') return raw[0];
  return 'User';
}

function buildUserFromJwtPayload(
  payload: Record<string, unknown>,
  fallbackEmail: string
): User {
  const sub = pickString(payload, CLAIM_NAME_ID) ?? pickString(payload, 'sub') ?? '';
  const email =
    pickString(payload, CLAIM_EMAIL) ??
    pickString(payload, 'email') ??
    pickString(payload, 'unique_name') ??
    fallbackEmail;

  const roleName = pickRole(payload);
  const roleKey = roleName.toLowerCase().replace(/\s+/g, '_');

  const local = email.includes('@') ? email.split('@')[0]! : email;
  const nameFromEmail = local
    ? local.charAt(0).toUpperCase() + local.slice(1)
    : 'İstifadəçi';

  return {
    id: sub || stablePositiveIntFromString(email),
    username: local || 'user',
    name: nameFromEmail,
    surname: '',
    email,
    contactNumber: '',
    position: '',
    role: {
      id: stablePositiveIntFromString(roleKey),
      key: roleKey,
      name: roleName,
    },
    image: '',
  };
}

export function isAuthLoginApiResponse(value: unknown): value is AuthLoginApiResponse {
  if (!value || typeof value !== 'object') return false;
  const v = value as AuthLoginApiResponse;
  return (
    typeof v.accessToken === 'string' &&
    typeof v.refreshToken === 'string' &&
    typeof v.expireAt === 'string'
  );
}

export function mapAuthLoginApiResponseToAuth(
  body: AuthLoginApiResponse,
  loginEmail: string
): Auth {
  const accessExpire = new Date(body.expireAt);
  const refreshExpire = new Date(accessExpire.getTime() + 30 * 24 * 60 * 60 * 1000);

  const payload = decodeJwtPayload(body.accessToken);
  const user =
    payload && typeof payload === 'object'
      ? buildUserFromJwtPayload(payload, loginEmail.trim())
      : buildUserFromJwtPayload({}, loginEmail.trim());

  return {
    user,
    accessToken: body.accessToken,
    refreshToken: body.refreshToken,
    accessTokenExpireDate: accessExpire,
    refreshTokenExpireDate: refreshExpire,
  };
}
