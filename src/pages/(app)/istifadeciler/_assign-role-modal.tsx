import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

import { Button, LoadingSpinner } from '@/components';
import { useGetAllRolesQuery } from '@/services/auth.service';
import { useAssignRoleMutation } from '@/services/user.service';
import { useShellTheme } from '@/widgets/app-shell/shell-theme-context';
import { cn } from '@/utils';
import type { UserListRow } from '@/types/user.type';

type Props = {
  open: boolean;
  user: UserListRow | null;
  onClose: () => void;
};

export function AssignRoleModal({ open, user, onClose }: Props) {
  const isDark = useShellTheme();
  const [roleName, setRoleName] = useState('');
  const { data: roles = [], isLoading: rolesLoading, isError: rolesError } = useGetAllRolesQuery(
    undefined,
    { skip: !open }
  );
  const [assignRole, { isLoading: assignLoading }] = useAssignRoleMutation();

  useEffect(() => {
    if (open) {
      setRoleName('');
    }
  }, [open, user?.id]);

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

  const selectClass = cn(
    'h-10 w-full rounded-md border px-3 text-sm outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-blue-500',
    isDark
      ? 'border-slate-600 bg-slate-950/50 text-slate-100'
      : 'border-slate-200 bg-white text-slate-900'
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName.trim()) return;
    try {
      await assignRole({ userId: user.id, roleName: roleName.trim() }).unwrap();
      onClose();
    } catch {
      return;
    }
  };

  const busy = assignLoading;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center overflow-y-auto p-4 py-10"
      role="dialog"
      aria-modal="true"
      aria-labelledby="assign-role-title"
    >
      <button
        type="button"
        className="fixed inset-0 bg-black/50"
        aria-label="Bağla"
        onClick={onClose}
      />
      <div
        className={cn(
          'relative z-10 my-auto w-full max-w-lg rounded-xl border p-6',
          panel
        )}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 id="assign-role-title" className="text-lg font-semibold">
              Rol təyin et
            </h2>
            <p className={cn('mt-1 text-sm', isDark ? 'text-slate-400' : 'text-slate-500')}>
              {user.userName}
              {user.email ? ` · ${user.email}` : ''}
            </p>
          </div>
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

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="assign-role-select" className="text-sm font-medium">
              Rol
            </label>
            {rolesLoading ? (
              <div className="flex items-center gap-2 py-2">
                <LoadingSpinner size="sm" className={isDark ? 'text-slate-400' : 'text-slate-500'} />
                <span className={cn('text-sm', isDark ? 'text-slate-400' : 'text-slate-500')}>
                  Rollar yüklənir…
                </span>
              </div>
            ) : rolesError ? (
              <p className="text-sm text-red-400">Rolları yükləmək mümkün olmadı.</p>
            ) : (
              <select
                id="assign-role-select"
                required
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                className={selectClass}
                disabled={busy || roles.length === 0}
              >
                <option value="">Rol seçin</option>
                {roles.map((r) => (
                  <option key={r.name} value={r.name}>
                    {r.name}
                    {r.description?.trim() ? ` — ${r.description}` : ''}
                  </option>
                ))}
              </select>
            )}
            {!rolesLoading && !rolesError && roles.length === 0 && (
              <p className={cn('text-sm', isDark ? 'text-slate-400' : 'text-slate-500')}>
                Heç bir rol tapılmadı. Əvvəlcə rollar səhifəsindən rol yaradın.
              </p>
            )}
          </div>

          <div className="mt-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={busy}
              className={
                isDark
                  ? 'border-slate-500 bg-slate-800 text-slate-100 hover:bg-slate-700 hover:text-white'
                  : undefined
              }
            >
              Ləğv et
            </Button>
            <Button
              type="submit"
              disabled={busy || rolesLoading || !roleName.trim() || roles.length === 0}
              className="border-0 bg-blue-600 text-white hover:bg-blue-500"
            >
              {busy ? <LoadingSpinner size="sm" className="text-white" /> : 'Təsdiq et'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
