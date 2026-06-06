import type { CurrentUserApiResponse, User } from '@/types/user.type';

function stablePositiveIntFromString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h) || 1;
}

export function isCurrentUserApiResponse(
  value: unknown
): value is CurrentUserApiResponse {
  if (!value || typeof value !== 'object') return false;
  const v = value as CurrentUserApiResponse;
  return (
    typeof v.id === 'string' &&
    typeof v.userName === 'string' &&
    typeof v.email === 'string' &&
    Array.isArray(v.roleName) &&
    v.roleName.every((x) => typeof x === 'string')
  );
}

export function mapCurrentUserApiToUser(r: CurrentUserApiResponse): User {
  const firstRole = r.roleName[0] ?? 'User';
  const roleKey = firstRole.toLowerCase().replace(/\s+/g, '_');
  const firstName = r.firstName?.trim() || '';
  const lastName = r.lastName?.trim() || '';
  const fullName = [firstName, lastName].filter(Boolean).join(' ');
  return {
    id: r.id,
    username: r.userName,
    firstName,
    lastName,
    name: fullName || r.userName,
    surname: lastName,
    email: r.email,
    contactNumber: '',
    position: r.positionName?.trim() || r.position?.trim() || '',
    role: {
      id: stablePositiveIntFromString(roleKey),
      name: firstRole,
      key: roleKey,
    },
    image: '',
  };
}
