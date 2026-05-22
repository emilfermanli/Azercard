import { useEffect, useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import {
  Eye,
  Filter,
  Pencil,
  Plus,
  RotateCcw,
  ShieldPlus,
  Trash2,
  Users,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import Select, { type SingleValue, type StylesConfig } from 'react-select';

import { Button, DataPagination, DataTable, LoadingSpinner } from '@/components';
import type { UserListRow } from '@/types/user.type';
import { useGetAllUsersQuery } from '@/services/user.service';
import { useGetAllRolesQuery } from '@/services/auth.service';
import {
  useGetDepartmentsQuery,
  useGetPositionsQuery,
} from '@/services/organization.service';

import { useShellTheme } from '@/widgets/app-shell/shell-theme-context';
import { cn } from '@/utils';
import { dataTableActionButtonClass } from '@/utils/data-table-action-button';

import { AssignRoleModal } from './_assign-role-modal';
import { UserCreateModal } from './_user-create-modal';
import { UserDeleteModal } from './_user-delete-modal';
import { UserEditModal } from './_user-edit-modal';
import { UserViewModal } from './_user-view-modal';

const PAGE_SIZE = 10;

type SelectOption = {
  label: string;
  value: string;
};

const IstifadecilerPage: React.FC = () => {
  const isDark = useShellTheme();
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [queryPageNumber, setQueryPageNumber] = useState(1);
  const [querySearch, setQuerySearch] = useState('');
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [positionId, setPositionId] = useState('');
  const [draftRole, setDraftRole] = useState('');
  const [draftDepartmentId, setDraftDepartmentId] = useState('');
  const [draftPositionId, setDraftPositionId] = useState('');
  const [viewUser, setViewUser] = useState<UserListRow | null>(null);
  const [assignUser, setAssignUser] = useState<UserListRow | null>(null);
  const [editUser, setEditUser] = useState<UserListRow | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UserListRow | null>(null);
  const { data: roles = [], isLoading: rolesLoading } = useGetAllRolesQuery();
  const { data: departments = [], isLoading: departmentsLoading } =
    useGetDepartmentsQuery();
  const { data: positions = [], isLoading: positionsLoading } = useGetPositionsQuery();

  useEffect(() => {
    if (filterDrawerOpen) {
      setSearch(querySearch);
      setDraftRole(role);
      setDraftDepartmentId(departmentId);
      setDraftPositionId(positionId);
    }
  }, [filterDrawerOpen, querySearch, role, departmentId, positionId]);

  const { data, isLoading, isError, isFetching } = useGetAllUsersQuery({
    pageNumber: queryPageNumber,
    pageSize: PAGE_SIZE,
    search: querySearch,
    role,
    departmentId,
    positionId,
  });

  const muted = isDark ? 'text-slate-400' : 'text-slate-500';

  const columns = useMemo<ColumnDef<UserListRow, unknown>[]>(
    () => [
      {
        id: 'sira',
        header: 'Sıra',
        cell: ({ row }) => (
          <span className="tabular-nums">
            {(queryPageNumber - 1) * PAGE_SIZE + row.index + 1}
          </span>
        ),
      },
      {
        accessorKey: 'firstName',
        header: 'Ad',
        cell: ({ row }) => row.original.firstName || <span className={muted}>—</span>,
      },
      {
        accessorKey: 'lastName',
        header: 'Soyad',
        cell: ({ row }) => row.original.lastName || <span className={muted}>—</span>,
      },
      {
        accessorKey: 'email',
        header: 'E-poçt',
      },
      {
        accessorKey: 'phoneNumber',
        header: 'Mobil nömrə',
        cell: ({ row }) => row.original.phoneNumber || <span className={muted}>—</span>,
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
          <div className="flex items-center justify-end gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn('h-9 w-9', dataTableActionButtonClass(isDark, 'view'))}
              aria-label="Baxış"
              onClick={() => setViewUser(row.original)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn('h-9 w-9', dataTableActionButtonClass(isDark, 'edit'))}
              aria-label="Redaktə et"
              onClick={() => setEditUser(row.original)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
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
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn('h-9 w-9', dataTableActionButtonClass(isDark, 'delete'))}
              aria-label="Sil"
              onClick={() => setDeleteTarget(row.original)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [queryPageNumber, isDark, muted]
  );

  const rows = data?.rows ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const hasNext = data?.hasNextPage ?? false;
  const hasPrev = data?.hasPreviousPage ?? false;

  const outlineButtonClass = isDark
    ? 'border-slate-500 bg-slate-800/90 text-slate-100 hover:bg-slate-700 hover:text-white'
    : '';
  const summaryCard = isDark
    ? 'border-slate-800 bg-slate-900/60 text-slate-100'
    : 'border-slate-200 bg-white text-slate-900 shadow-sm';
  const headerPanel = isDark
    ? 'border-slate-800 bg-slate-900/70 shadow-black/20'
    : 'border-slate-200 bg-white shadow-slate-200/70';
  const iconPanel = isDark ? 'bg-blue-500/15 text-blue-300' : 'bg-blue-50 text-blue-700';
  const primaryButton = isDark
    ? 'h-10 shrink-0 gap-2 border-0 bg-blue-600 px-4 text-white shadow-lg shadow-blue-950/20 hover:bg-blue-500 sm:self-start'
    : 'h-10 shrink-0 gap-2 border-0 bg-slate-950 px-4 text-white shadow-lg shadow-slate-950/15 hover:bg-slate-800 sm:self-start';
  const tableClass = isDark
    ? 'border-slate-800 bg-slate-900/70'
    : 'border-slate-200 bg-white';
  const inputClass = [
    'h-10 w-full rounded-lg border px-3 text-sm outline-none ring-blue-500/40 transition focus:ring-2',
    isDark
      ? 'border-slate-700 bg-slate-950 text-slate-100 placeholder:text-slate-500'
      : 'border-slate-200 bg-white text-slate-900 placeholder:text-slate-400',
  ].join(' ');
  const hasActiveFilters = Boolean(querySearch || role || departmentId || positionId);
  const selectOptions = useMemo(
    () => ({
      roles: roles.map((item) => ({ label: item.name, value: item.name })),
      departments: departments.map((item) => ({ label: item.name, value: item.id })),
      positions: positions.map((item) => ({ label: item.name, value: item.id })),
    }),
    [departments, positions, roles]
  );
  const selectStyles = useMemo<StylesConfig<SelectOption, false>>(
    () => ({
      control: (base, state) => ({
        ...base,
        minHeight: 40,
        borderRadius: 8,
        borderColor: state.isFocused ? '#3b82f6' : isDark ? '#334155' : '#e2e8f0',
        backgroundColor: isDark ? '#020617' : '#ffffff',
        boxShadow: state.isFocused ? '0 0 0 2px rgb(59 130 246 / 0.4)' : 'none',
        ':hover': {
          borderColor: state.isFocused ? '#3b82f6' : isDark ? '#475569' : '#cbd5e1',
        },
      }),
      input: (base) => ({
        ...base,
        color: isDark ? '#f8fafc' : '#0f172a',
      }),
      menu: (base) => ({
        ...base,
        zIndex: 80,
        border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
        backgroundColor: isDark ? '#020617' : '#ffffff',
        boxShadow: isDark
          ? '0 18px 40px rgb(0 0 0 / 0.35)'
          : '0 18px 40px rgb(15 23 42 / 0.12)',
      }),
      option: (base, state) => ({
        ...base,
        backgroundColor: state.isSelected
          ? '#2563eb'
          : state.isFocused
            ? isDark
              ? '#1e293b'
              : '#eff6ff'
            : 'transparent',
        color: state.isSelected ? '#ffffff' : isDark ? '#f8fafc' : '#0f172a',
      }),
      placeholder: (base) => ({
        ...base,
        color: isDark ? '#94a3b8' : '#64748b',
      }),
      singleValue: (base) => ({
        ...base,
        color: isDark ? '#f8fafc' : '#0f172a',
      }),
    }),
    [isDark]
  );


  const selectedDraftRole = selectOptions.roles.find((item) => item.value === draftRole) ?? null;
  const selectedDraftDepartment =
    selectOptions.departments.find((item) => item.value === draftDepartmentId) ?? null;
  const selectedDraftPosition =
    selectOptions.positions.find((item) => item.value === draftPositionId) ?? null;

  const resetFilters = () => {
    setSearch('');
    setQuerySearch('');
    setRole('');
    setDepartmentId('');
    setPositionId('');
    setDraftRole('');
    setDraftDepartmentId('');
    setDraftPositionId('');
    setQueryPageNumber(1);
    setFilterDrawerOpen(false);
  };

  const applyFilters = () => {
    setQuerySearch(search);
    setRole(draftRole);
    setDepartmentId(draftDepartmentId);
    setPositionId(draftPositionId);
    setQueryPageNumber(1);
    setFilterDrawerOpen(false);
  };

  return (
    <div className="space-y-5 px-4 sm:px-6 xl:pr-5">
      <AssignRoleModal
        open={assignUser !== null}
        user={assignUser}
        onClose={() => setAssignUser(null)}
      />
      <UserCreateModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <UserEditModal
        open={editUser !== null}
        user={editUser}
        onClose={() => setEditUser(null)}
      />
      <UserViewModal
        open={viewUser !== null}
        user={viewUser}
        onClose={() => setViewUser(null)}
      />
      <UserDeleteModal
        open={deleteTarget !== null}
        user={deleteTarget}
        onClose={() => setDeleteTarget(null)}
      />

      <div className={['rounded-xl border p-4 shadow-lg sm:p-5', headerPanel].join(' ')}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <span
              className={[
                'flex h-12 w-12 shrink-0 items-center justify-center rounded-lg',
                iconPanel,
              ].join(' ')}
            >
              <Users className="h-6 w-6" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase text-blue-500">Komanda</p>
              <h1
                className={[
                  'mt-1 text-2xl font-semibold tracking-tight',
                  isDark ? 'text-white' : 'text-slate-950',
                ].join(' ')}
              >
                İstifadəçilər
              </h1>
              <p className={['mt-2 max-w-2xl text-sm leading-6', muted].join(' ')}>
                Sistem istifadəçilərinə baxın, yeni hesab yaradın və rolları sürətli
                şəkildə təyin edin.
              </p>
            </div>
          </div>
          <Button
            type="button"
            className={primaryButton}
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Yeni istifadəçi
          </Button>
        </div>
      </div>

      {(isLoading || isFetching) && !data && (
        <div
          className={['flex justify-center rounded-xl border py-12', summaryCard].join(
            ' '
          )}
        >
          <LoadingSpinner
            size="lg"
            className={isDark ? 'text-slate-400' : 'text-slate-500'}
          />
        </div>
      )}
      {isError && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          Məlumat yüklənərkən xəta baş verdi.
        </p>
      )}

      {data && (
        <>
          <div
            aria-hidden={!filterDrawerOpen}
            className="fixed inset-0 z-[110] h-dvh transition pointer-events-none"
          >
            <button
              aria-label="Filter panelini bağla"
              className={[
                'absolute inset-0 bg-slate-950/40 transition-opacity',
                filterDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
              ].join(' ')}
              onClick={() => setFilterDrawerOpen(false)}
              type="button"
            />
            <aside
              aria-label="Filterlər"
              className={[
                'fixed bottom-0 right-0 top-0 flex h-dvh min-h-dvh w-full max-w-[420px] flex-col border-l shadow-2xl transition-transform duration-300 ease-out pointer-events-auto',
                filterDrawerOpen ? 'translate-x-0' : 'translate-x-full',
                isDark
                  ? 'border-slate-800 bg-slate-950 text-slate-100'
                  : 'border-slate-200 bg-white text-slate-950',
              ].join(' ')}
            >
              <button
                aria-expanded={filterDrawerOpen}
                aria-label={filterDrawerOpen ? 'Filter panelini bağla' : 'Filter panelini aç'}
                className={[
                  'absolute right-full bottom-32 z-[90] translate-x-[calc(50%-16px)] -rotate-90 origin-center flex h-8 items-center gap-1.5 rounded-t-md border-x border-t px-3.5 text-[10px] font-bold uppercase tracking-wider shadow-2xl transition pointer-events-auto',
                  isDark
                    ? 'border-blue-500/30 bg-slate-950/95 text-blue-400 hover:text-blue-300 hover:bg-slate-900'
                    : 'border-blue-200 bg-white/95 text-blue-600 hover:text-blue-700 hover:bg-blue-50',
                ].join(' ')}
                onClick={() => setFilterDrawerOpen(!filterDrawerOpen)}
                type="button"
              >
                {filterDrawerOpen ? (
                  <ChevronRight className="h-3.5 w-3.5 rotate-90 text-blue-500" />
                ) : (
                  <ChevronLeft className="h-3.5 w-3.5 rotate-90 text-blue-500" />
                )}
                <span>Filterlər</span>
                {hasActiveFilters && (
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500" aria-hidden="true" />
                )}
              </button>
              <div
                className={[
                  'flex items-start justify-between gap-3 border-b p-4',
                  isDark ? 'border-slate-800' : 'border-slate-200',
                ].join(' ')}
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/15 text-blue-500">
                    <Filter className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="font-semibold">Filterlər</h2>
                    <p className={['text-sm', muted].join(' ')}>
                      İstifadəçiləri rol, departament, pozisiya və axtarış üzrə süzün.
                    </p>
                  </div>
                </div>
                <button
                  aria-label="Filter panelini bağla"
                  className={[
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition',
                    isDark
                      ? 'border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
                  ].join(' ')}
                  onClick={() => setFilterDrawerOpen(false)}
                  type="button"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto p-4">
                <div className="grid gap-3">
                  <label className="space-y-1.5 text-sm font-medium">
                    <span className={muted}>Axtarış</span>
                    <input
                      className={inputClass}
                      placeholder="Ad və ya e-poçt"
                      value={search}
                      onChange={(event) => {
                        setSearch(event.target.value);
                      }}
                    />
                  </label>

                  <label className="space-y-1.5 text-sm font-medium">
                    <span className={muted}>Rol</span>
                    <Select
                      inputId="users-filter-role"
                      isClearable
                      isLoading={rolesLoading}
                      noOptionsMessage={() => 'Rol tapılmadı'}
                      onChange={(option: SingleValue<SelectOption>) => {
                        setDraftRole(option?.value ?? '');
                      }}
                      options={selectOptions.roles}
                      placeholder="Bütün rollar"
                      styles={selectStyles}
                      value={selectedDraftRole}
                    />
                  </label>

                  <label className="space-y-1.5 text-sm font-medium">
                    <span className={muted}>Departament</span>
                    <Select
                      inputId="users-filter-department"
                      isClearable
                      isLoading={departmentsLoading}
                      noOptionsMessage={() => 'Departament tapılmadı'}
                      onChange={(option: SingleValue<SelectOption>) => {
                        setDraftDepartmentId(option?.value ?? '');
                      }}
                      options={selectOptions.departments}
                      placeholder="Bütün departamentlər"
                      styles={selectStyles}
                      value={selectedDraftDepartment}
                    />
                  </label>

                  <label className="space-y-1.5 text-sm font-medium">
                    <span className={muted}>Pozisiya</span>
                    <Select
                      inputId="users-filter-position"
                      isClearable
                      isLoading={positionsLoading}
                      noOptionsMessage={() => 'Pozisiya tapılmadı'}
                      onChange={(option: SingleValue<SelectOption>) => {
                        setDraftPositionId(option?.value ?? '');
                      }}
                      options={selectOptions.positions}
                      placeholder="Bütün pozisiyalar"
                      styles={selectStyles}
                      value={selectedDraftPosition}
                    />
                  </label>
                </div>
              </div>

              <div
                className={[
                  'flex items-center justify-between gap-3 border-t p-4',
                  isDark ? 'border-slate-800' : 'border-slate-200',
                ].join(' ')}
              >
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className={outlineButtonClass}
                  disabled={!hasActiveFilters && !search && !draftRole && !draftDepartmentId && !draftPositionId}
                  onClick={resetFilters}
                >
                  <RotateCcw className="h-4 w-4" />
                  Təmizlə
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="bg-blue-600 text-white hover:bg-blue-700"
                  onClick={applyFilters}
                >
                  Təsdiq et
                </Button>
              </div>
            </aside>
          </div>

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
                  <p className={`text-xs font-medium sm:text-sm ${muted}`}>
                    Ümumi istifadəçi sayı
                  </p>
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
                    className={[
                      'h-4 w-4 sm:h-5 sm:w-5',
                      isDark ? 'text-blue-400' : 'text-blue-600',
                    ].join(' ')}
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
            <DataTable columns={columns} data={rows} className={tableClass} />
          </div>

          <DataPagination
            hasNext={hasNext}
            hasPrev={hasPrev}
            isFetching={isFetching}
            onPageChange={setQueryPageNumber}
            page={data.pageNumber ?? queryPageNumber}
            pageSize={PAGE_SIZE}
            totalCount={totalCount}
            totalPages={totalPages}
          />
        </>
      )}
    </div>
  );
};

export default IstifadecilerPage;
