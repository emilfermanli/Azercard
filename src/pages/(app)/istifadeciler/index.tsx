import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Plus, ShieldPlus, Users } from 'lucide-react';

import { Button, DataTable, LoadingSpinner } from '@/components';
import type { UserListRow } from '@/types/user.type';
import { useGetAllUsersQuery } from '@/services/user.service';
import { useShellTheme } from '@/widgets/app-shell/shell-theme-context';
import { cn } from '@/utils';
import { dataTableActionButtonClass } from '@/utils/data-table-action-button';

import { AssignRoleModal } from './_assign-role-modal';
import { UserCreateModal } from './_user-create-modal';

const PAGE_SIZE = 10;

const IstifadecilerPage: React.FC = () => {
  const isDark = useShellTheme();
  const [pageNumber, setPageNumber] = useState(1);
  const [assignUser, setAssignUser] = useState<UserListRow | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const { data, isLoading, isError, isFetching } = useGetAllUsersQuery({
    pageNumber,
    pageSize: PAGE_SIZE,
  });

  const muted = isDark ? 'text-slate-400' : 'text-slate-500';

  const columns = useMemo<ColumnDef<UserListRow, unknown>[]>(
    () => [
      {
        id: 'sira',
        header: 'Sıra',
        cell: ({ row }) => (
          <span className="tabular-nums">
            {(pageNumber - 1) * PAGE_SIZE + row.index + 1}
          </span>
        ),
      },
      {
        accessorKey: 'userName',
        header: 'İstifadəçi adı',
      },
      {
        accessorKey: 'email',
        header: 'E-poçt',
      },
      {
        id: 'roles',
        header: 'Rollar',
        cell: ({ row }) => {
          const roles = row.original.roleNames;
          if (roles.length === 0) {
            return <span className={muted}>—</span>;
          }
          const [first, ...rest] = roles;
          const extra = rest.length;
          const badgeBase = isDark
            ? 'bg-slate-700/90 text-slate-200 ring-1 ring-slate-600/80'
            : 'bg-slate-200/90 text-slate-700 ring-1 ring-slate-300/80';
          const tipSurface = isDark
            ? 'border-slate-600 bg-slate-800 text-slate-100 shadow-black/40'
            : 'border-slate-200 bg-white text-slate-800 shadow-md';

          if (roles.length === 1) {
            return <span>{first}</span>;
          }

          return (
            <span
              tabIndex={0}
              className={cn(
                'group/roles relative inline-flex max-w-full flex-wrap items-center gap-1.5 rounded-sm outline-none',
                'cursor-help focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1',
                isDark ? 'ring-offset-slate-900' : 'ring-offset-white'
              )}
              aria-label={`Bütün rollar: ${roles.join(', ')}`}
            >
              <span className="min-w-0">{first}</span>
              <span
                className={cn(
                  'shrink-0 rounded-md px-1.5 py-0.5 text-xs font-semibold tabular-nums',
                  badgeBase
                )}
              >
                +{extra}
              </span>
              <span
                role="tooltip"
                className={cn(
                  'pointer-events-none absolute left-1/2 top-full z-[60] mt-1.5 max-w-xs min-w-[10rem] -translate-x-1/2 rounded-lg border px-2.5 py-2 text-left text-xs font-normal leading-snug whitespace-normal opacity-0 shadow-lg ring-1 transition-opacity duration-150',
                  tipSurface,
                  isDark ? 'ring-white/10' : 'ring-slate-900/5',
                  'group-hover/roles:opacity-100 group-focus-within/roles:opacity-100'
                )}
              >
                {roles.join(' · ')}
              </span>
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: () => <span className="block text-right">Əməliyyatlar</span>,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn('h-9 w-9', dataTableActionButtonClass(isDark, 'assignRole'))}
              aria-label="Rol təyin et"
              onClick={() => setAssignUser(row.original)}
            >
              <ShieldPlus className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [pageNumber, isDark, muted]
  );

  const rows = data?.rows ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const hasNext = data?.hasNextPage ?? false;
  const hasPrev = data?.hasPreviousPage ?? false;

  const paginationStrong = isDark ? 'font-medium text-white' : 'font-medium text-slate-900';
  const paginationOutlineBtn = isDark
    ? 'border-slate-500 bg-slate-800/90 text-slate-100 hover:bg-slate-700 hover:text-white'
    : '';
  const summaryCard = isDark
    ? 'border-slate-700/60 bg-slate-900/50 text-slate-100'
    : 'border-slate-200 bg-white text-slate-900 shadow-sm';

  return (
    <div className="space-y-4">
      <AssignRoleModal open={assignUser !== null} user={assignUser} onClose={() => setAssignUser(null)} />
      <UserCreateModal open={createOpen} onClose={() => setCreateOpen(false)} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1
            className={[
              'text-2xl font-bold tracking-tight',
              isDark ? 'text-white' : 'text-slate-900',
            ].join(' ')}
          >
            İstifadəçilər
          </h1>
        </div>
        <Button
          type="button"
          className="h-10 shrink-0 gap-2 border-0 bg-gradient-to-r from-blue-600 to-indigo-600 px-4 text-white shadow-md hover:from-blue-500 hover:to-indigo-500 sm:self-start"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Yeni istifadəçi
        </Button>
      </div>

      {(isLoading || isFetching) && !data && (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" className={isDark ? 'text-slate-400' : 'text-slate-500'} />
        </div>
      )}
      {isError && (
        <p className="text-sm text-red-400">Məlumat yüklənərkən xəta baş verdi.</p>
      )}

      {data && (
        <>
          <div className="grid grid-cols-12 gap-4">
            <div
              className={[
                'col-span-12 sm:col-span-6 lg:col-span-3',
                'relative overflow-hidden rounded-xl border p-4',
                summaryCard,
              ].join(' ')}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className={`text-xs font-medium sm:text-sm ${muted}`}>Ümumi istifadəçi sayı</p>
                  <p
                    className={[
                      'mt-1.5 truncate text-xl font-semibold tabular-nums tracking-tight sm:text-2xl',
                      isDark ? 'text-white' : 'text-slate-900',
                    ].join(' ')}
                  >
                    {totalCount.toLocaleString('az-AZ')}
                  </p>
                </div>
                <span
                  className={[
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg sm:h-10 sm:w-10',
                    isDark ? 'bg-blue-500/15' : 'bg-blue-50',
                  ].join(' ')}
                >
                  <Users
                    className={['h-4 w-4 sm:h-5 sm:w-5', isDark ? 'text-blue-400' : 'text-blue-600'].join(' ')}
                  />
                </span>
              </div>
            </div>
          </div>

          <div className="relative">
            {isFetching && (
              <div
                className={[
                  'pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-black/10',
                  isDark ? 'bg-slate-950/40' : 'bg-white/60',
                ].join(' ')}
              >
                <LoadingSpinner size="md" className={muted} />
              </div>
            )}
            <DataTable columns={columns} data={rows} />
          </div>

          <div
            className={[
              'flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between',
              isDark ? 'border-slate-800' : 'border-slate-200',
            ].join(' ')}
          >
            <p className={`text-sm ${muted}`}>
              Səhifə <span className={paginationStrong}>{pageNumber}</span> /{' '}
              <span className={paginationStrong}>{totalPages}</span>
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={paginationOutlineBtn}
                disabled={!hasPrev || isFetching}
                onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
              >
                Əvvəl
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={paginationOutlineBtn}
                disabled={!hasNext || isFetching}
                onClick={() => setPageNumber((p) => p + 1)}
              >
                Növbəti
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default IstifadecilerPage;
