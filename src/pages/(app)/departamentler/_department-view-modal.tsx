import { useEffect } from 'react';
import { X } from 'lucide-react';

import { Button, LoadingSpinner } from '@/components';
import { useGetDepartmentByIdQuery } from '@/services/organization.service';
import { useShellTheme } from '@/widgets/app-shell/shell-theme-context';
import { cn } from '@/utils';

type Props = {
  open: boolean;
  departmentId: string | null;
  onClose: () => void;
};

export function DepartmentViewModal({ open, departmentId, onClose }: Props) {
  const isDark = useShellTheme();
  const skip = !open || !departmentId;
  const { data, isLoading, isError } = useGetDepartmentByIdQuery(departmentId ?? '', {
    skip,
  });

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const panel = isDark
    ? 'border-slate-600 bg-slate-900 text-slate-100 shadow-2xl'
    : 'border-slate-200 bg-white text-slate-900 shadow-xl';

  const muted = isDark ? 'text-slate-400' : 'text-slate-500';

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dept-view-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Bağla"
        onClick={onClose}
      />
      <div
        className={cn(
          'relative z-10 w-full max-w-md rounded-xl border p-6',
          panel
        )}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 id="dept-view-title" className="text-lg font-semibold">
            Departament
          </h2>
          <button
            type="button"
            onClick={onClose}
            className={cn(
              'rounded-lg p-1 transition-colors',
              isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-slate-500 hover:bg-slate-100'
            )}
            aria-label="Bağla"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {isLoading && (
          <div className="flex justify-center py-10">
            <LoadingSpinner size="lg" className={muted} />
          </div>
        )}
        {isError && (
          <p className="text-sm text-red-400">Məlumat yüklənərkən xəta baş verdi.</p>
        )}
        {data && !isLoading && (
          <div className="flex flex-col gap-4">
            <div>
              <p className={cn('text-xs font-medium uppercase tracking-wide', muted)}>Ad</p>
              <p className="mt-1 text-sm font-medium">{data.name}</p>
            </div>
            <div>
              <p className={cn('text-xs font-medium uppercase tracking-wide', muted)}>Təsvir</p>
              <p className="mt-1 whitespace-pre-wrap text-sm">{data.description || '—'}</p>
            </div>
            <div className="mt-2 flex justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className={
                  isDark
                    ? 'border-slate-500 bg-slate-800 text-slate-100 hover:bg-slate-700 hover:text-white'
                    : undefined
                }
              >
                Bağla
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
