import { useEffect } from 'react';
import { X } from 'lucide-react';

import { Button } from '@/components';
import type { UserListRow } from '@/types/user.type';
import { useShellTheme } from '@/widgets/app-shell/shell-theme-context';
import { cn } from '@/utils';

type Props = {
  open: boolean;
  user: UserListRow | null;
  onClose: () => void;
};

export function UserViewModal({ open, user, onClose }: Props) {
  const isDark = useShellTheme();

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
  const badgeClass = isDark
    ? 'bg-slate-800 text-slate-200 ring-1 ring-slate-700'
    : 'bg-slate-100 text-slate-700 ring-1 ring-slate-200';

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center overflow-y-auto p-4 py-10"
      role="dialog"
      aria-modal="true"
      aria-labelledby="user-view-title"
    >
      <button
        type="button"
        className="fixed inset-0 bg-black/50"
        aria-label="Bağla"
        onClick={onClose}
      />
      <div className={cn('relative z-10 my-auto w-full max-w-lg rounded-xl border p-6', panel)}>
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 id="user-view-title" className="text-lg font-semibold">
            İstifadəçi
          </h2>
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

        <div className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className={cn('text-xs font-medium uppercase tracking-wide', muted)}>
                Ad
              </p>
              <p className="mt-1 text-sm font-medium">{user.firstName || '—'}</p>
            </div>
            <div>
              <p className={cn('text-xs font-medium uppercase tracking-wide', muted)}>
                Soyad
              </p>
              <p className="mt-1 text-sm font-medium">{user.lastName || '—'}</p>
            </div>
          </div>
          <div>
            <p className={cn('text-xs font-medium uppercase tracking-wide', muted)}>
              E-poçt
            </p>
            <p className="mt-1 text-sm">{user.email || '—'}</p>
          </div>
          <div>
            <p className={cn('text-xs font-medium uppercase tracking-wide', muted)}>
              Mobil nömrə
            </p>
            <p className="mt-1 text-sm">{user.phoneNumber || '—'}</p>
          </div>
          <div>
            <p className={cn('text-xs font-medium uppercase tracking-wide', muted)}>
              Rollar
            </p>
            {user.roleNames.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {user.roleNames.map((role) => (
                  <span
                    key={role}
                    className={cn('rounded-md px-2 py-1 text-xs font-semibold', badgeClass)}
                  >
                    {role}
                  </span>
                ))}
              </div>
            ) : (
              <p className={cn('mt-1 text-sm', muted)}>Rol təyin edilməyib.</p>
            )}
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
      </div>
    </div>
  );
}
