import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X } from 'lucide-react';

import { Button, Input, LoadingSpinner } from '@/components';
import type {
  CreateDepartmentPayload,
  UpdateDepartmentPayload,
} from '@/types/organization.type';
import {
  useGetDepartmentByIdQuery,
  useUpdateDepartmentMutation,
} from '@/services/organization.service';
import { useShellTheme } from '@/widgets/app-shell/shell-theme-context';
import { cn } from '@/utils';

type Props = {
  open: boolean;
  departmentId: string | null;
  onClose: () => void;
};

export function DepartmentEditModal({ open, departmentId, onClose }: Props) {
  const isDark = useShellTheme();
  const skip = !open || !departmentId;
  const { data, isLoading, isError } = useGetDepartmentByIdQuery(departmentId ?? '', {
    skip,
  });
  const [updateDepartment, { isLoading: isSaving }] = useUpdateDepartmentMutation();
  const { register, handleSubmit, reset } = useForm<CreateDepartmentPayload>({
    defaultValues: { name: '', description: '' },
  });

  useEffect(() => {
    if (!open) {
      reset({ name: '', description: '' });
      return;
    }
    if (data) {
      reset({ name: data.name, description: data.description ?? '' });
    }
  }, [open, departmentId, data, reset]);

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

  if (!open || !departmentId) return null;

  const panel = isDark
    ? 'border-slate-600 bg-slate-900 text-slate-100 shadow-2xl'
    : 'border-slate-200 bg-white text-slate-900 shadow-xl';

  const muted = isDark ? 'text-slate-400' : 'text-slate-500';

  const onSubmit = handleSubmit(async (values) => {
    try {
      const payload: UpdateDepartmentPayload = {
        id: departmentId,
        name: values.name.trim(),
        description: values.description.trim(),
      };
      await updateDepartment(payload).unwrap();
      onClose();
    } catch {
      return;
    }
  });

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dept-edit-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Bağla"
        onClick={onClose}
      />
      <div className={cn('relative z-10 w-full max-w-md rounded-xl border p-6', panel)}>
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 id="dept-edit-title" className="text-lg font-semibold">
            Departamenti redaktə et
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

        {isLoading && (
          <div className="flex justify-center py-10">
            <LoadingSpinner size="lg" className={muted} />
          </div>
        )}
        {isError && (
          <p className="text-sm text-red-400">Məlumat yüklənərkən xəta baş verdi.</p>
        )}
        {data && !isLoading && (
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="dept-edit-name" className="text-sm font-medium">
                Ad
              </label>
              <Input
                id="dept-edit-name"
                autoComplete="off"
                className={
                  isDark ? 'border-slate-600 bg-slate-950/50 text-slate-100' : ''
                }
                {...register('name', { required: true })}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="dept-edit-desc" className="text-sm font-medium">
                Təsvir
              </label>
              <Input
                id="dept-edit-desc"
                autoComplete="off"
                className={
                  isDark ? 'border-slate-600 bg-slate-950/50 text-slate-100' : ''
                }
                {...register('description', { required: true })}
              />
            </div>
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
                disabled={isSaving}
                className="border-0 bg-blue-600 text-white hover:bg-blue-500"
              >
                {isSaving ? <LoadingSpinner size="sm" className="text-white" /> : 'Saxla'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
