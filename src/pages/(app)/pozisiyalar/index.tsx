import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Briefcase, Eye, Pencil, Plus, Trash2 } from 'lucide-react';

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
  const activeCount = data.filter((position) => position.isActive).length;
  const inactiveCount = data.length - activeCount;
  const headerPanel = isDark
    ? 'border-slate-800 bg-slate-900/70 shadow-black/20'
    : 'border-slate-200 bg-white shadow-slate-200/70';
  const iconPanel = isDark ? 'bg-cyan-500/15 text-cyan-300' : 'bg-cyan-50 text-cyan-700';
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
    <div className="space-y-5 pt-2 pb-2 pl-2 pr-4 sm:pt-3 sm:pb-3 sm:pl-3 sm:pr-6">
      <div className={['rounded-xl border p-4 shadow-lg sm:p-5', headerPanel].join(' ')}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <span
              className={[
                'flex h-12 w-12 shrink-0 items-center justify-center rounded-lg',
                iconPanel,
              ].join(' ')}
            >
              <Briefcase className="h-6 w-6" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase text-cyan-500">
                Vəzifə kataloqu
              </p>
              <h1
                className={[
                  'mt-1 text-2xl font-semibold tracking-tight',
                  isDark ? 'text-white' : 'text-slate-950',
                ].join(' ')}
              >
                Pozisiyalar
              </h1>
              <p className={['mt-2 max-w-2xl text-sm leading-6', muted].join(' ')}>
                Vəzifə mövqelərinin statusunu izləyin, yeni pozisiyalar əlavə edin və
                məlumatları redaktə edin.
              </p>
            </div>
          </div>
          <Button
            type="button"
            className={primaryButton}
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Yeni pozisiya
          </Button>
        </div>
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
              <p className={['text-sm font-medium', muted].join(' ')}>Ümumi pozisiya</p>
              <p className="mt-2 text-3xl font-semibold tabular-nums">
                {data.length.toLocaleString('az-AZ')}
              </p>
            </div>
            <div className={['rounded-xl border p-4', statPanel].join(' ')}>
              <p className={['text-sm font-medium', muted].join(' ')}>Aktiv</p>
              <p className="mt-2 text-3xl font-semibold tabular-nums text-emerald-500">
                {activeCount.toLocaleString('az-AZ')}
              </p>
            </div>
            <div className={['rounded-xl border p-4', statPanel].join(' ')}>
              <p className={['text-sm font-medium', muted].join(' ')}>Deaktiv</p>
              <p className="mt-2 text-3xl font-semibold tabular-nums text-amber-500">
                {inactiveCount.toLocaleString('az-AZ')}
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

export default PozisiyalarPage;
