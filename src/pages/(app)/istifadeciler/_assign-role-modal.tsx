import { useEffect, useMemo, useState } from 'react';
import { ShieldMinus, X } from 'lucide-react';
import Select, { type SingleValue, type StylesConfig } from 'react-select';

import { Button, LoadingSpinner } from '@/components';
import { useGetAllRolesQuery } from '@/services/auth.service';
import { useAssignRoleMutation, useRemoveRoleMutation } from '@/services/user.service';
import { useShellTheme } from '@/widgets/app-shell/shell-theme-context';
import { cn } from '@/utils';
import type { UserListRow } from '@/types/user.type';
import { toast } from '@/hooks/useToast';

type Props = {
  open: boolean;
  user: UserListRow | null;
  onClose: () => void;
};

type SelectOption = {
  label: string;
  value: string;
};

export function AssignRoleModal({ open, user, onClose }: Props) {
  const isDark = useShellTheme();
  const [roleName, setRoleName] = useState('');
  const [localRoleNames, setLocalRoleNames] = useState<string[]>([]);
  const {
    data: roles = [],
    isLoading: rolesLoading,
    isError: rolesError,
  } = useGetAllRolesQuery(undefined, { skip: !open });
  const [assignRole, { isLoading: assignLoading }] = useAssignRoleMutation();
  const [removeRole, { isLoading: removeLoading }] = useRemoveRoleMutation();
  const [removingRoleName, setRemovingRoleName] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setRoleName('');
      setRemovingRoleName(null);
      setLocalRoleNames(user?.roleNames ?? []);
    }
  }, [open, user?.id, user?.roleNames]);

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

  const currentRoleNames = useMemo(() => {
    const normalized = new Map<string, string>();
    localRoleNames.forEach((name) => {
      const trimmed = name.trim();
      if (trimmed) normalized.set(trimmed.toLocaleLowerCase('az-AZ'), trimmed);
    });
    return Array.from(normalized.values());
  }, [localRoleNames]);

  const availableRoles = useMemo(() => {
    const assigned = new Set(
      currentRoleNames.map((name) => name.toLocaleLowerCase('az-AZ'))
    );
    return roles.filter((role) => !assigned.has(role.name.toLocaleLowerCase('az-AZ')));
  }, [currentRoleNames, roles]);
  const roleOptions = useMemo<SelectOption[]>(
    () =>
      availableRoles.map((role) => ({
        label: role.description?.trim()
          ? `${role.name} — ${role.description}`
          : role.name,
        value: role.name,
      })),
    [availableRoles]
  );
  const selectedRole = roleOptions.find((option) => option.value === roleName) ?? null;
  const selectMenuPortalTarget =
    typeof document === 'undefined' ? undefined : document.body;
  const selectStyles = useMemo<StylesConfig<SelectOption, false>>(
    () => ({
      control: (base, state) => ({
        ...base,
        minHeight: 40,
        borderRadius: 6,
        borderColor: state.isFocused ? '#3b82f6' : isDark ? '#475569' : '#e2e8f0',
        backgroundColor: isDark ? 'rgb(2 6 23 / 0.5)' : '#ffffff',
        boxShadow: state.isFocused ? '0 0 0 2px rgb(59 130 246 / 0.4)' : 'none',
        ':hover': {
          borderColor: state.isFocused ? '#3b82f6' : isDark ? '#64748b' : '#cbd5e1',
        },
      }),
      input: (base) => ({
        ...base,
        color: isDark ? '#f8fafc' : '#0f172a',
      }),
      menu: (base) => ({
        ...base,
        border: `1px solid ${isDark ? '#475569' : '#e2e8f0'}`,
        backgroundColor: isDark ? '#020617' : '#ffffff',
        boxShadow: isDark
          ? '0 18px 40px rgb(0 0 0 / 0.35)'
          : '0 18px 40px rgb(15 23 42 / 0.12)',
      }),
      menuPortal: (base) => ({
        ...base,
        zIndex: 240,
      }),
      option: (base, state) => ({
        ...base,
        backgroundColor: state.isSelected
          ? '#2563eb'
          : state.isFocused
            ? isDark
              ? '#1e293b'
              : '#eff6ff'
            : 'transparent',
        color: state.isSelected ? '#ffffff' : isDark ? '#f8fafc' : '#0f172a',
      }),
      placeholder: (base) => ({
        ...base,
        color: isDark ? '#94a3b8' : '#64748b',
      }),
      singleValue: (base) => ({
        ...base,
        color: isDark ? '#f8fafc' : '#0f172a',
      }),
    }),
    [isDark]
  );

  if (!open || !user) return null;

  const panel = isDark
    ? 'border-slate-600 bg-slate-900 text-slate-100 shadow-2xl'
    : 'border-slate-200 bg-white text-slate-900 shadow-xl';

  const roleChip = isDark
    ? 'border-slate-700 bg-slate-800 text-slate-100'
    : 'border-slate-200 bg-slate-50 text-slate-800';
  const roleChipButton = isDark
    ? 'text-red-300 hover:bg-red-950/60 hover:text-red-100 disabled:text-slate-500'
    : 'text-red-600 hover:bg-red-50 hover:text-red-700 disabled:text-slate-400';
  const emptyBox = isDark
    ? 'border-slate-700 bg-slate-950/45 text-slate-400'
    : 'border-slate-200 bg-slate-50 text-slate-500';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName.trim()) return;
    try {
      await assignRole({ userId: user.id, roleName: roleName.trim() }).unwrap();
      toast({
        variant: 'success',
        title: 'Rol əlavə olundu',
        description: `${user.userName} üçün rol siyahısı yeniləndi.`,
      });
      setLocalRoleNames((prev) => [...prev, roleName.trim()]);
      setRoleName('');
      onClose();
    } catch {
      return;
    }
  };

  const handleRemove = async (name: string) => {
    setRemovingRoleName(name);
    try {
      await removeRole({ userId: user.id, roleName: name }).unwrap();
      toast({
        variant: 'success',
        title: 'Rol silindi',
        description: `${name} rolu istifadəçidən silindi.`,
      });
      setLocalRoleNames((prev) =>
        prev.filter(
          (role) => role.toLocaleLowerCase('az-AZ') !== name.toLocaleLowerCase('az-AZ')
        )
      );
    } catch {
      return;
    } finally {
      setRemovingRoleName(null);
    }
  };

  const busy = assignLoading || removeLoading;

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
              İstifadəçi rolları
            </h2>
            <p
              className={cn('mt-1 text-sm', isDark ? 'text-slate-400' : 'text-slate-500')}
            >
              {user.userName}
              {user.email ? ` · ${user.email}` : ''}
            </p>
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

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <div>
              <span className="text-sm font-medium">Cari rollar</span>
              <p
                className={cn(
                  'mt-1 text-xs',
                  isDark ? 'text-slate-400' : 'text-slate-500'
                )}
              >
                Rolu silmək üçün rolun yanındakı silmə ikonuna klikləyin.
              </p>
            </div>
            {currentRoleNames.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {currentRoleNames.map((name) => {
                  const isRemoving = removingRoleName === name;
                  return (
                    <span
                      key={name}
                      className={cn(
                        'inline-flex min-h-9 max-w-full items-center gap-1 rounded-md border py-1 pl-3 pr-1 text-sm font-medium',
                        roleChip
                      )}
                    >
                      <span className="min-w-0 truncate">{name}</span>
                      <button
                        type="button"
                        className={cn(
                          'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition disabled:cursor-not-allowed',
                          roleChipButton
                        )}
                        disabled={busy}
                        aria-label={`${name} rolunu sil`}
                        title={`${name} rolunu sil`}
                        onClick={() => handleRemove(name)}
                      >
                        {isRemoving ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          <ShieldMinus className="h-4 w-4" />
                        )}
                      </button>
                    </span>
                  );
                })}
              </div>
            ) : (
              <div className={cn('rounded-lg border px-3 py-2 text-sm', emptyBox)}>
                Bu istifadəçiyə rol təyin edilməyib.
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="assign-role-select" className="text-sm font-medium">
                Yeni rol əlavə et
              </label>
              {rolesLoading ? (
                <div className="flex items-center gap-2 py-2">
                  <LoadingSpinner
                    size="sm"
                    className={isDark ? 'text-slate-400' : 'text-slate-500'}
                  />
                  <span
                    className={cn(
                      'text-sm',
                      isDark ? 'text-slate-400' : 'text-slate-500'
                    )}
                  >
                    Rollar yüklənir…
                  </span>
                </div>
              ) : rolesError ? (
                <p className="text-sm text-red-400">Rolları yükləmək mümkün olmadı.</p>
              ) : (
                <Select
                  inputId="assign-role-select"
                  isDisabled={busy || availableRoles.length === 0}
                  menuPortalTarget={selectMenuPortalTarget}
                  noOptionsMessage={() => 'Rol tapılmadı'}
                  onChange={(option: SingleValue<SelectOption>) =>
                    setRoleName(option?.value ?? '')
                  }
                  options={roleOptions}
                  placeholder="Rol seçin"
                  styles={selectStyles}
                  value={selectedRole}
                />
              )}
              {!rolesLoading && !rolesError && roles.length === 0 && (
                <p
                  className={cn('text-sm', isDark ? 'text-slate-400' : 'text-slate-500')}
                >
                  Heç bir rol tapılmadı. Əvvəlcə rollar səhifəsindən rol yaradın.
                </p>
              )}
              {!rolesLoading &&
                !rolesError &&
                roles.length > 0 &&
                availableRoles.length === 0 && (
                  <p
                    className={cn(
                      'text-sm',
                      isDark ? 'text-slate-400' : 'text-slate-500'
                    )}
                  >
                    Bu istifadəçiyə bütün mövcud rollar artıq təyin edilib.
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
                disabled={
                  busy || rolesLoading || !roleName.trim() || availableRoles.length === 0
                }
                className="border-0 bg-blue-600 text-white hover:bg-blue-500"
              >
                {assignLoading ? (
                  <LoadingSpinner size="sm" className="text-white" />
                ) : (
                  'Əlavə et'
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
