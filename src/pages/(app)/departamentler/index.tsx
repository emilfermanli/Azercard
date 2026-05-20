import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Building2, Eye, Pencil, Plus, Trash2 } from 'lucide-react';

import { Button, DataTable, LoadingSpinner } from '@/components';
import type { Department } from '@/types/organization.type';
import { useGetDepartmentsQuery } from '@/services/organization.service';
import { useShellTheme } from '@/widgets/app-shell/shell-theme-context';
import { cn } from '@/utils';
import { dataTableActionButtonClass } from '@/utils/data-table-action-button';

import { DepartmentCreateModal } from './_department-create-modal';
import { DepartmentDeleteModal } from './_department-delete-modal';
import { DepartmentEditModal } from './_department-edit-modal';
import { DepartmentViewModal } from './_department-view-modal';

const DepartamentlerPage: React.FC = () => {
  const isDark = useShellTheme();
  const [createOpen, setCreateOpen] = useState(false);
  const [viewId, setViewId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Department | null>(null);
  const { data = [], isLoading, isError, isFetching } = useGetDepartmentsQuery();

  const columns = useMemo<ColumnDef<Department, unknown>[]>(
    () => [
      {
        id: 'sira',
        header: 'Sıra',
        cell: ({ row }) => <span className="tabular-nums">{row.index + 1}</span>,
      },
      {
        accessorKey: 'name',
        header: 'Ad',
      },
      {
        accessorKey: 'description',
        header: 'Təsvir',
        cell: ({ getValue }) => {
          const v = getValue() as string;
          return <span className="max-w-md truncate">{v || '—'}</span>;
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
              onClick={() => setViewId(row.original.id)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn('h-9 w-9', dataTableActionButtonClass(isDark, 'edit'))}
              aria-label="Redaktə et"
              onClick={() => setEditId(row.original.id)}
            >
              <Pencil className="h-4 w-4" />
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
    [isDark]
  );

  const muted = isDark ? 'text-slate-300' : 'text-slate-500';
  const headerPanel = isDark
    ? 'border-slate-800 bg-slate-900/70 shadow-black/20'
    : 'border-slate-200 bg-white shadow-slate-200/70';
  const iconPanel = isDark ? 'bg-blue-500/15 text-blue-300' : 'bg-blue-50 text-blue-700';
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
              <Building2 className="h-6 w-6" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase text-blue-500">Struktur</p>
              <h1
                className={[
                  'mt-1 text-2xl font-semibold tracking-tight',
                  isDark ? 'text-white' : 'text-slate-950',
                ].join(' ')}
              >
                Departamentlər
              </h1>
              <p className={['mt-2 max-w-2xl text-sm leading-6', muted].join(' ')}>
                Təşkilat strukturundakı departamentləri yaradın, baxın və məlumatları
                yeniləyin.
              </p>
            </div>
          </div>
          <Button
            type="button"
            className={primaryButton}
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Yeni departament
          </Button>
        </div>
      </div>

      <DepartmentCreateModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <DepartmentViewModal
        open={viewId !== null}
        departmentId={viewId}
        onClose={() => setViewId(null)}
      />
      <DepartmentEditModal
        open={editId !== null}
        departmentId={editId}
        onClose={() => setEditId(null)}
      />
      <DepartmentDeleteModal
        open={deleteTarget !== null}
        department={deleteTarget}
        onClose={() => setDeleteTarget(null)}
      />

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
              <p className={['text-sm font-medium', muted].join(' ')}>
                Ümumi departament
              </p>
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

export default DepartamentlerPage;
