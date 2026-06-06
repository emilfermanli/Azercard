import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X } from 'lucide-react';

import { Button, Input, LoadingSpinner } from '@/components';
import type { CreateDepartmentPayload } from '@/types/organization.type';
import { useCreateDepartmentMutation } from '@/services/organization.service';
import { useShellTheme } from '@/widgets/app-shell/shell-theme-context';
import { cn } from '@/utils';

type Props = {
  open: boolean;
  onClose: () => void;
};

export function DepartmentCreateModal({ open, onClose }: Props) {
  const isDark = useShellTheme();
  const [createDepartment, { isLoading }] = useCreateDepartmentMutation();
  const { register, handleSubmit, reset } = useForm<CreateDepartmentPayload>({
    defaultValues: { name: '', description: '' },
  });

  useEffect(() => {
    if (!open) {
      reset({ name: '', description: '' });
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

  const onSubmit = handleSubmit(async (values) => {
    try {
      await createDepartment({
        name: values.name.trim(),
        description: values.description.trim(),
      }).unwrap();
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
      aria-labelledby="dept-create-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Bağla"
        onClick={onClose}
      />
      <div className={cn('relative z-10 w-full max-w-md rounded-xl border p-6', panel)}>
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 id="dept-create-title" className="text-lg font-semibold">
            Yeni departament
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

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="dept-name" className="text-sm font-medium">
              Ad
            </label>
            <Input
              id="dept-name"
              autoComplete="off"
              className={isDark ? 'border-slate-600 bg-slate-950/50 text-slate-100' : ''}
              {...register('name', { required: true })}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="dept-desc" className="text-sm font-medium">
              Təsvir
            </label>
            <Input
              id="dept-desc"
              autoComplete="off"
              className={isDark ? 'border-slate-600 bg-slate-950/50 text-slate-100' : ''}
              {...register('description', { required: true })}
            />
          </div>
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
              disabled={isLoading}
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
