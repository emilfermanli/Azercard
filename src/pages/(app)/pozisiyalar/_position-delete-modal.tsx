import { useEffect } from 'react';
import { X } from 'lucide-react';

import { Button, LoadingSpinner } from '@/components';
import type { Position } from '@/types/organization.type';
import { useDeletePositionMutation } from '@/services/organization.service';
import { useShellTheme } from '@/widgets/app-shell/shell-theme-context';
import { cn } from '@/utils';

type Props = {
  open: boolean;
  position: Position | null;
  onClose: () => void;
};

export function PositionDeleteModal({ open, position, onClose }: Props) {
  const isDark = useShellTheme();
  const [deletePosition, { isLoading }] = useDeletePositionMutation();

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

  if (!open || !position) return null;

  const panel = isDark
    ? 'border-slate-600 bg-slate-900 text-slate-100 shadow-2xl'
    : 'border-slate-200 bg-white text-slate-900 shadow-xl';

  const muted = isDark ? 'text-slate-400' : 'text-slate-500';

  const onConfirm = async () => {
    try {
      await deletePosition(position.id).unwrap();
      onClose();
    } catch {
      return;
    }
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pos-del-title"
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
          <h2 id="pos-del-title" className="text-lg font-semibold">
            Pozisiyanı sil
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

        <p className="text-sm">
          <span className={isDark ? 'font-semibold text-white' : 'font-semibold text-slate-900'}>
            {position.name}
          </span>{' '}
          <span className={muted}>
            pozisiyasını silmək istədiyinizə əminsiniz? Bu əməliyyat geri qaytarıla bilməz.
          </span>
        </p>

        <div className="mt-6 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className={
              isDark
                ? 'border-slate-500 bg-slate-800 text-slate-100 hover:bg-slate-700 hover:text-white'
                : undefined
            }
          >
            Ləğv et
          </Button>
          <Button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className="border-0 bg-red-600 text-white hover:bg-red-500"
          >
            {isLoading ? <LoadingSpinner size="sm" className="text-white" /> : 'Sil'}
          </Button>
        </div>
      </div>
    </div>
  );
}
