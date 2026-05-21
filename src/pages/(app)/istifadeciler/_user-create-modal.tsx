import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, X } from 'lucide-react';

import { Button, Input, LoadingSpinner } from '@/components';
import { useGetDepartmentsQuery, useGetPositionsQuery } from '@/services/organization.service';
import { useRegisterUserMutation } from '@/services/user.service';
import { useShellTheme } from '@/widgets/app-shell/shell-theme-context';
import { cn } from '@/utils';
import { parseRejectedApiErrorMessages } from '@/utils/api-error';

type FormValues = {
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  firstName: string;
  lastName: string;
  departmentId: string;
  positionId: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
};

export function UserCreateModal({ open, onClose }: Props) {
  const isDark = useShellTheme();
  const [backendErrors, setBackendErrors] = useState<string[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registerUser, { isLoading }] = useRegisterUserMutation();
  const { data: departments = [], isLoading: deptLoading } = useGetDepartmentsQuery(undefined, {
    skip: !open,
  });
  const { data: positions = [], isLoading: posLoading } = useGetPositionsQuery(undefined, {
    skip: !open,
  });

  const { register, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      phone: '',
      firstName: '',
      lastName: '',
      departmentId: '',
      positionId: '',
    },
  });

  useEffect(() => {
    if (open) {
      setBackendErrors([]);
      setShowPassword(false);
      setShowConfirmPassword(false);
      reset({
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        firstName: '',
        lastName: '',
        departmentId: '',
        positionId: '',
      });
    }
  }, [open, reset]);

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

  const inputClass = isDark ? 'border-slate-600 bg-slate-950/50 text-slate-100' : '';
  const passwordInputClass = cn(inputClass, 'pr-10');
  const passwordToggleClass = cn(
    'absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
    isDark
      ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
      : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
  );

  const selectClass = cn(
    'h-9 w-full rounded-md border px-3 text-sm outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-blue-500',
    isDark ? 'border-slate-600 bg-slate-950/50 text-slate-100' : 'border-slate-200 bg-white text-slate-900'
  );

  const listsLoading = deptLoading || posLoading;
  const canPickOrg = !listsLoading && departments.length > 0 && positions.length > 0;

  const onSubmit = handleSubmit(async (values) => {
    setBackendErrors([]);

    if (values.password !== values.confirmPassword) {
      setBackendErrors(['Şifrə və şifrə təkrarı eyni olmalıdır.']);
      return;
    }

    try {
      await registerUser({
        email: values.email.trim(),
        password: values.password,
        phone: values.phone.trim(),
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        departmentId: values.departmentId,
        positionId: values.positionId,
      }).unwrap();
      onClose();
    } catch (error) {
      const messages = parseRejectedApiErrorMessages(error);
      setBackendErrors(messages.length > 0 ? messages : ['İstifadəçi yaratmaq mümkün olmadı.']);
    }
  });

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center overflow-y-auto p-4 py-10"
      role="dialog"
      aria-modal="true"
      aria-labelledby="user-create-title"
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
          <h2 id="user-create-title" className="text-lg font-semibold">
            Yeni istifadəçi
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

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          {backendErrors.length > 0 && (
            <div
              className={cn(
                'rounded-lg border px-3 py-2 text-sm',
                isDark
                  ? 'border-red-500/30 bg-red-500/10 text-red-200'
                  : 'border-red-200 bg-red-50 text-red-700'
              )}
            >
              <p className="font-semibold">Xəta baş verdi</p>
              <ul className="mt-1 list-disc space-y-1 pl-5">
                {backendErrors.map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label htmlFor="user-create-first" className="text-sm font-medium">
                Ad
              </label>
              <Input
                id="user-create-first"
                autoComplete="given-name"
                className={inputClass}
                {...register('firstName')}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="user-create-last" className="text-sm font-medium">
                Soyad
              </label>
              <Input
                id="user-create-last"
                autoComplete="family-name"
                className={inputClass}
                {...register('lastName')}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="user-create-email" className="text-sm font-medium">
              E-poçt
            </label>
            <Input
              id="user-create-email"
              type="email"
              autoComplete="email"
              className={inputClass}
              {...register('email')}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="user-create-password" className="text-sm font-medium">
              Şifrə
            </label>
            <div className="relative">
              <Input
                id="user-create-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                className={passwordInputClass}
                {...register('password')}
              />
              <button
                aria-label={showPassword ? 'Şifrəni gizlət' : 'Şifrəni göstər'}
                className={passwordToggleClass}
                onClick={() => setShowPassword((value) => !value)}
                type="button"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="user-create-confirm-password" className="text-sm font-medium">
              Şifrə təkrarı
            </label>
            <div className="relative">
              <Input
                id="user-create-confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                className={passwordInputClass}
                {...register('confirmPassword')}
              />
              <button
                aria-label={
                  showConfirmPassword ? 'Şifrə təkrarını gizlət' : 'Şifrə təkrarını göstər'
                }
                className={passwordToggleClass}
                onClick={() => setShowConfirmPassword((value) => !value)}
                type="button"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="user-create-phone" className="text-sm font-medium">
              Telefon
            </label>
            <Input
              id="user-create-phone"
              type="tel"
              autoComplete="tel"
              className={inputClass}
              {...register('phone')}
            />
          </div>

          {listsLoading ? (
            <div className="flex items-center gap-2 py-2">
              <LoadingSpinner size="sm" className={isDark ? 'text-slate-400' : 'text-slate-500'} />
              <span className={cn('text-sm', isDark ? 'text-slate-400' : 'text-slate-500')}>
                Departament və pozisiyalar yüklənir…
              </span>
            </div>
          ) : !canPickOrg ? (
            <p className={cn('text-sm', isDark ? 'text-amber-400' : 'text-amber-700')}>
              İstifadəçi yaratmaq üçün əvvəlcə departament və pozisiya əlavə edin.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label htmlFor="user-create-dept" className="text-sm font-medium">
                  Departament
                </label>
                <select
                  id="user-create-dept"
                  className={selectClass}
                  {...register('departmentId')}
                >
                  <option value="">Seçin</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="user-create-pos" className="text-sm font-medium">
                  Pozisiya
                </label>
                <select
                  id="user-create-pos"
                  className={selectClass}
                  {...register('positionId')}
                >
                  <option value="">Seçin</option>
                  {positions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="mt-2 flex justify-end gap-2">
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
              type="submit"
              disabled={isLoading || listsLoading || !canPickOrg}
              className="border-0 bg-blue-600 text-white hover:bg-blue-500"
            >
              {isLoading ? <LoadingSpinner size="sm" className="text-white" /> : 'Yarat'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
