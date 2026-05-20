import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Plus, Shield } from 'lucide-react';

import { Button, DataTable, LoadingSpinner } from '@/components';
import type { RoleRow } from '@/types/role.type';
import { useGetAllRolesQuery } from '@/services/auth.service';
import { useShellTheme } from '@/widgets/app-shell/shell-theme-context';

import { RoleCreateModal } from './_role-create-modal';

const RollarPage: React.FC = () => {
  const isDark = useShellTheme();
  const [createOpen, setCreateOpen] = useState(false);
  const { data = [], isLoading, isError, isFetching } = useGetAllRolesQuery();

  const columns = useMemo<ColumnDef<RoleRow, unknown>[]>(
    () => [
      {
        id: 'sira',
        header: 'Sıra',
        cell: ({ row }) => <span className="tabular-nums">{row.index + 1}</span>,
      },
      {
        accessorKey: 'name',
        header: 'Rol adı',
      },
      {
        accessorKey: 'description',
        header: 'Təsvir',
        cell: ({ getValue }) => {
          const v = getValue() as string;
          return <span className="max-w-md truncate">{v || '—'}</span>;
        },
      },
    ],
    []
  );

  const muted = isDark ? 'text-slate-300' : 'text-slate-500';
  const headerPanel = isDark
    ? 'border-slate-800 bg-slate-900/70 shadow-black/20'
    : 'border-slate-200 bg-white shadow-slate-200/70';
  const iconPanel = isDark
    ? 'bg-violet-500/15 text-violet-300'
    : 'bg-violet-50 text-violet-700';
  const statPanel = isDark
    ? 'border-slate-800 bg-slate-900/60 text-slate-100'
    : 'border-slate-200 bg-white text-slate-900 shadow-sm';
  const primaryButton = isDark
    ? 'h-10 shrink-0 gap-2 border-0 bg-blue-600 px-4 text-white shadow-lg shadow-blue-950/20 hover:bg-blue-500 sm:self-start'
    : 'h-10 shrink-0 gap-2 border-0 bg-slate-950 px-4 text-white shadow-lg shadow-slate-950/15 hover:bg-slate-800 sm:self-start';
  const tableClass = isDark
    ? 'border-slate-800 bg-slate-900/70'
    : 'border-slate-200 bg-white';

  return (
    <div className="space-y-5">
      <div className={['rounded-xl border p-4 shadow-lg sm:p-5', headerPanel].join(' ')}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <span
              className={[
                'flex h-12 w-12 shrink-0 items-center justify-center rounded-lg',
                iconPanel,
              ].join(' ')}
            >
              <Shield className="h-6 w-6" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase text-violet-500">İcazələr</p>
              <h1
                className={[
                  'mt-1 text-2xl font-semibold tracking-tight',
                  isDark ? 'text-white' : 'text-slate-950',
                ].join(' ')}
              >
                Rollar
              </h1>
              <p className={['mt-2 max-w-2xl text-sm leading-6', muted].join(' ')}>
                Sistem daxilində istifadəçilərə təyin edilən rol və təsvirləri idarə edin.
              </p>
            </div>
          </div>
          <Button
            type="button"
            className={primaryButton}
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Yeni rol
          </Button>
        </div>
      </div>

      <RoleCreateModal open={createOpen} onClose={() => setCreateOpen(false)} />

      {isLoading && (
        <div
          className={['flex justify-center rounded-xl border py-12', statPanel].join(' ')}
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

      {!isLoading && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className={['rounded-xl border p-4', statPanel].join(' ')}>
              <p className={['text-sm font-medium', muted].join(' ')}>Ümumi rol</p>
              <p className="mt-2 text-3xl font-semibold tabular-nums">
                {data.length.toLocaleString('az-AZ')}
              </p>
            </div>
          </div>
          <div className="relative">
            {isFetching && (
              <div
                className={[
                  'pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-xl',
                  isDark ? 'bg-slate-950/40' : 'bg-white/60',
                ].join(' ')}
              >
                <LoadingSpinner size="md" className={muted} />
              </div>
            )}
            <DataTable columns={columns} data={data} className={tableClass} />
          </div>
        </div>
      )}
    </div>
  );
};

export default RollarPage;
