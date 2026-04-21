import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Eye, Pencil, Plus, Trash2 } from 'lucide-react';

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

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1
            className={[
              'text-2xl font-bold tracking-tight',
              isDark ? 'text-white' : 'text-slate-900',
            ].join(' ')}
          >
            Departamentlər
          </h1>
          <p className={['mt-1 text-sm', muted].join(' ')}>Bütün departamentlərin siyahısı</p>
        </div>
        <Button
          type="button"
          className="h-10 shrink-0 gap-2 border-0 bg-gradient-to-r from-blue-600 to-indigo-600 px-4 text-white shadow-md hover:from-blue-500 hover:to-indigo-500 sm:self-start"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Yeni departament
        </Button>
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
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" className={isDark ? 'text-slate-400' : 'text-slate-500'} />
        </div>
      )}
      {isError && (
        <p className="text-sm text-red-400">Məlumat yüklənərkən xəta baş verdi.</p>
      )}

      {!isLoading && (
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
          <DataTable columns={columns} data={data} />
        </div>
      )}
    </div>
  );
};

export default DepartamentlerPage;
