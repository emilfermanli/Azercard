import type {
  GetAllUsersApiResponse,
  GetAllUsersResult,
  UserListItemApi,
  UserListRow,
} from '@/types/user.type';

function normalizeRoleNames(raw: string[] | undefined): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((r) => (typeof r === 'string' ? r.trim() : '')).filter(Boolean);
}

function mapItemToRow(item: UserListItemApi): UserListRow {
  return {
    id: item.id,
    userName: item.userName,
    email: item.email,
    roleNames: normalizeRoleNames(item.roleName),
  };
}

export function mapGetAllUsersResponse(raw: unknown): GetAllUsersResult {
  const r = raw as GetAllUsersApiResponse;
  const items = Array.isArray(r?.items) ? r.items : [];
  return {
    rows: items.map(mapItemToRow),
    totalCount: typeof r?.totalCount === 'number' ? r.totalCount : items.length,
    pageNumber: typeof r?.pageNumber === 'number' ? r.pageNumber : 1,
    pageSize: typeof r?.pageSize === 'number' ? r.pageSize : items.length || 10,
    totalPages: typeof r?.totalPages === 'number' ? r.totalPages : 1,
    hasNextPage: Boolean(r?.hasNextPage),
    hasPreviousPage: Boolean(r?.hasPreviousPage),
  };
}
