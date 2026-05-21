import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { X } from 'lucide-react';
import Select, { type SingleValue, type StylesConfig } from 'react-select';

import { Button, Input, LoadingSpinner } from '@/components';
import type { EditUserPayload, UserListRow } from '@/types/user.type';
import {
  useGetDepartmentsQuery,
  useGetPositionsQuery,
} from '@/services/organization.service';
import { useEditUserMutation } from '@/services/user.service';
import { useShellTheme } from '@/widgets/app-shell/shell-theme-context';
import { cn } from '@/utils';
import { parseRejectedApiErrorMessages } from '@/utils/api-error';
import { toast } from '@/hooks/useToast';

type FormValues = Omit<EditUserPayload, 'userId'>;

type Props = {
  open: boolean;
  user: UserListRow | null;
  onClose: () => void;
};

type SelectOption = {
  label: string;
  value: string;
};

export function UserEditModal({ open, user, onClose }: Props) {
  const isDark = useShellTheme();
  const [backendErrors, setBackendErrors] = useState<string[]>([]);
  const [editUser, { isLoading: isSaving }] = useEditUserMutation();
  const { data: departments = [], isLoading: deptLoading } = useGetDepartmentsQuery(
    undefined,
    { skip: !open }
  );
  const { data: positions = [], isLoading: posLoading } = useGetPositionsQuery(
    undefined,
    { skip: !open }
  );

  const { register, handleSubmit, reset, setValue, watch } = useForm<FormValues>({
    defaultValues: {
      email: '',
      phone: '',
      firstName: '',
      lastName: '',
      departmentId: null,
      positionId: null,
    },
  });

  useEffect(() => {
    if (!open || !user) return;
    setBackendErrors([]);
    reset({
      email: user.email,
      phone: user.phoneNumber,
      firstName: user.firstName,
      lastName: user.lastName,
      departmentId: user.departmentId || null,
      positionId: user.positionId || null,
    });
  }, [open, reset, user]);

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

  const panel = isDark
    ? 'border-slate-600 bg-slate-900 text-slate-100 shadow-2xl'
    : 'border-slate-200 bg-white text-slate-900 shadow-xl';
  const inputClass = isDark ? 'border-slate-600 bg-slate-950/50 text-slate-100' : '';
  const muted = isDark ? 'text-slate-400' : 'text-slate-500';
  const listsLoading = deptLoading || posLoading;
  const selectMenuPortalTarget =
    typeof document === 'undefined' ? undefined : document.body;
  const departmentId = watch('departmentId');
  const positionId = watch('positionId');
  const departmentOptions = useMemo<SelectOption[]>(
    () => departments.map((item) => ({ label: item.name, value: item.id })),
    [departments]
  );
  const positionOptions = useMemo<SelectOption[]>(
    () => positions.map((item) => ({ label: item.name, value: item.id })),
    [positions]
  );
  const selectedDepartment =
    departmentOptions.find((option) => option.value === departmentId) ?? null;
  const selectedPosition =
    positionOptions.find((option) => option.value === positionId) ?? null;
  const selectStyles = useMemo<StylesConfig<SelectOption, false>>(
    () => ({
      control: (base, state) => ({
        ...base,
        minHeight: 36,
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

  const onSubmit = handleSubmit(async (values) => {
    setBackendErrors([]);
    try {
      await editUser({
        userId: user.id,
        email: values.email.trim(),
        phone: values.phone.trim(),
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        departmentId: values.departmentId || null,
        positionId: values.positionId || null,
      }).unwrap();
      toast({
        variant: 'success',
        title: 'İstifadəçi yeniləndi',
        description: `${values.firstName.trim() || user.email} məlumatları saxlanıldı.`,
      });
      onClose();
    } catch (error) {
      const messages = parseRejectedApiErrorMessages(error);
      setBackendErrors(
        messages.length > 0 ? messages : ['İstifadəçini yeniləmək mümkün olmadı.']
      );
    }
  });

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center overflow-y-auto p-4 py-10"
      role="dialog"
      aria-modal="true"
      aria-labelledby="user-edit-title"
    >
      <button
        type="button"
        className="fixed inset-0 bg-black/50"
        aria-label="Bağla"
        onClick={onClose}
      />
      <div
        className={cn(
          'relative z-10 my-auto max-h-[min(90vh,720px)] w-full max-w-xl overflow-y-auto rounded-xl border p-6',
          panel
        )}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 id="user-edit-title" className="text-lg font-semibold">
              İstifadəçini redaktə et
            </h2>
            <p className={cn('mt-1 text-sm', muted)}>{user.email}</p>
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

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          {backendErrors.length > 0 && (
            <div className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
              {backendErrors.map((message) => (
                <p key={message}>{message}</p>
              ))}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label htmlFor="user-edit-first" className="text-sm font-medium">
                Ad
              </label>
              <Input
                id="user-edit-first"
                autoComplete="given-name"
                className={inputClass}
                {...register('firstName')}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="user-edit-last" className="text-sm font-medium">
                Soyad
              </label>
              <Input
                id="user-edit-last"
                autoComplete="family-name"
                className={inputClass}
                {...register('lastName')}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="user-edit-email" className="text-sm font-medium">
              E-poçt
            </label>
            <Input
              id="user-edit-email"
              type="email"
              autoComplete="email"
              className={inputClass}
              {...register('email', { required: true })}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="user-edit-phone" className="text-sm font-medium">
              Telefon
            </label>
            <Input
              id="user-edit-phone"
              type="tel"
              autoComplete="tel"
              className={inputClass}
              {...register('phone')}
            />
          </div>

          {listsLoading ? (
            <div className="flex items-center gap-2 py-2">
              <LoadingSpinner size="sm" className={muted} />
              <span className={cn('text-sm', muted)}>
                Departament və pozisiyalar yüklənir...
              </span>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label htmlFor="user-edit-dept" className="text-sm font-medium">
                  Departament
                </label>
                <Select
                  inputId="user-edit-dept"
                  isClearable
                  menuPortalTarget={selectMenuPortalTarget}
                  noOptionsMessage={() => 'Departament tapılmadı'}
                  onChange={(option: SingleValue<SelectOption>) =>
                    setValue('departmentId', option?.value ?? null, {
                      shouldDirty: true,
                    })
                  }
                  options={departmentOptions}
                  placeholder="Seçin"
                  styles={selectStyles}
                  value={selectedDepartment}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="user-edit-pos" className="text-sm font-medium">
                  Pozisiya
                </label>
                <Select
                  inputId="user-edit-pos"
                  isClearable
                  menuPortalTarget={selectMenuPortalTarget}
                  noOptionsMessage={() => 'Pozisiya tapılmadı'}
                  onChange={(option: SingleValue<SelectOption>) =>
                    setValue('positionId', option?.value ?? null, {
                      shouldDirty: true,
                    })
                  }
                  options={positionOptions}
                  placeholder="Seçin"
                  styles={selectStyles}
                  value={selectedPosition}
                />
              </div>
            </div>
          )}

          <div className="mt-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSaving}
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
              disabled={isSaving || listsLoading}
              className="border-0 bg-blue-600 text-white hover:bg-blue-500"
            >
              {isSaving ? <LoadingSpinner size="sm" className="text-white" /> : 'Saxla'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
