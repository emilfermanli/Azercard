import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Eye, Pencil, Plus, Trash2 } from 'lucide-react';

import { Button, DataTable, LoadingSpinner } from '@/components';
import type { Position } from '@/types/organization.type';
import { useGetPositionsQuery } from '@/services/organization.service';
import { useShellTheme } from '@/widgets/app-shell/shell-theme-context';
import { cn } from '@/utils';
import { dataTableActionButtonClass } from '@/utils/data-table-action-button';

import { PositionCreateModal } from './_position-create-modal';
import { PositionDeleteModal } from './_position-delete-modal';
import { PositionEditModal } from './_position-edit-modal';
import { PositionViewModal } from './_position-view-modal';

const PozisiyalarPage: React.FC = () => {
  const isDark = useShellTheme();
  const [createOpen, setCreateOpen] = useState(false);
  const [viewId, setViewId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Position | null>(null);
  const { data = [], isLoading, isError, isFetching } = useGetPositionsQuery();

  const columns = useMemo<ColumnDef<Position, unknown>[]>(
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
        id: 'isActive',
        header: 'Aktiv',
        accessorFn: (row) => row.isActive,
        cell: ({ getValue }) => ((getValue() as boolean) ? 'Bəli' : 'Xeyr'),
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
            Pozisiyalar
          </h1>
          <p className={['mt-1 text-sm', muted].join(' ')}>
            Bütün vəzifə mövqelərinin siyahısı
          </p>
        </div>
        <Button
          type="button"
          className="h-10 shrink-0 gap-2 border-0 bg-gradient-to-r from-blue-600 to-indigo-600 px-4 text-white shadow-md hover:from-blue-500 hover:to-indigo-500 sm:self-start"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Yeni pozisiya
        </Button>
      </div>

      <PositionCreateModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <PositionViewModal
        open={viewId !== null}
        positionId={viewId}
        onClose={() => setViewId(null)}
      />
      <PositionEditModal
        open={editId !== null}
        positionId={editId}
        onClose={() => setEditId(null)}
      />
      <PositionDeleteModal
        open={deleteTarget !== null}
        position={deleteTarget}
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

export default PozisiyalarPage;
