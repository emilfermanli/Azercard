import { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

import { Button } from '@/components';
import type { UserListRow } from '@/types/user.type';
import { useShellTheme } from '@/widgets/app-shell/shell-theme-context';
import { cn } from '@/utils';
import { useDeleteUserMutation } from '@/services/user.service';
import { toast } from '@/hooks/useToast';

type Props = {
  open: boolean;
  user: UserListRow | null;
  onClose: () => void;
};

export function UserDeleteModal({ open, user, onClose }: Props) {
  const isDark = useShellTheme();
  const [deleteUser, { isLoading }] = useDeleteUserMutation();

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

  if (!open || !user) return null;

  const panel = isDark
    ? 'border-slate-600 bg-slate-900 text-slate-100 shadow-2xl'
    : 'border-slate-200 bg-white text-slate-900 shadow-xl';
  const muted = isDark ? 'text-slate-400' : 'text-slate-500';

  const displayName =
    [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email;

  const handleDelete = async () => {
    try {
      await deleteUser(user.id).unwrap();
      toast({
        title: 'Uğurlu',
        description: 'İstifadəçi uğurla silindi.',
        variant: 'success',
      });
      onClose();
    } catch {
      // Error is handled by RTK Query; modal stays open
    }
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center overflow-y-auto p-4 py-10"
      role="dialog"
      aria-modal="true"
      aria-labelledby="user-delete-title"
    >
      <button
        type="button"
        className="fixed inset-0 bg-black/50"
        aria-label="Bağla"
        onClick={onClose}
      />
      <div
        className={cn(
          'relative z-10 my-auto w-full max-w-md rounded-xl border p-6',
          panel
        )}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                isDark ? 'bg-red-500/15 text-red-400' : 'bg-red-50 text-red-600'
              )}
            >
              <AlertTriangle className="h-5 w-5" />
            </span>
            <h2 id="user-delete-title" className="text-lg font-semibold">
              İstifadəçini sil
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={cn(
              'rounded-lg p-1 transition-colors',
              isDark
                ? 'text-slate-400 hover:bg-slate-800 hover:text-white'
                : 'text-slate-500 hover:bg-slate-100'
            )}
            aria-label="Bağla"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className={cn('text-sm leading-relaxed', muted)}>
          <strong className={isDark ? 'text-slate-100' : 'text-slate-900'}>
            &quot;{displayName}&quot;
          </strong>{' '}
          istifadəçisini silmək istədiyinizə əminsiniz? Bu əməliyyat geri qaytarıla
          bilməz.
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
            onClick={() => void handleDelete()}
            className="border-0 bg-red-600 text-white shadow-md hover:bg-red-500"
          >
            {isLoading ? 'Silinir...' : 'Sil'}
          </Button>
        </div>
      </div>
    </div>
  );
}
