import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { X } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

import { Button, Input, LoadingSpinner } from '@/components';
import { useCreatePositionMutation } from '@/services/organization.service';
import { useShellTheme } from '@/widgets/app-shell/shell-theme-context';
import { cn } from '@/utils';

type FormValues = {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
};

type Props = {
  open: boolean;
  onClose: () => void;
};

export function PositionCreateModal({ open, onClose }: Props) {
  const isDark = useShellTheme();
  const [createPosition, { isLoading }] = useCreatePositionMutation();
  const { register, handleSubmit, reset, control } = useForm<FormValues>({
    defaultValues: {
      id: '',
      name: '',
      description: '',
      isActive: true,
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        id: uuidv4(),
        name: '',
        description: '',
        isActive: true,
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

  const onSubmit = handleSubmit(async (values) => {
    try {
      await createPosition({
        id: values.id,
        name: values.name.trim(),
        description: values.description.trim(),
        isActive: values.isActive,
      }).unwrap();
      onClose();
    } catch {
      return;
    }
  });

  const checkClass = cn(
    'h-4 w-4 rounded border align-middle',
    isDark ? 'border-slate-500 bg-slate-950' : 'border-slate-300'
  );

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center overflow-y-auto p-4 py-10"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pos-create-title"
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
          <h2 id="pos-create-title" className="text-lg font-semibold">
            Yeni pozisiya
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
          <div className="flex flex-col gap-2">
            <label htmlFor="pos-create-name" className="text-sm font-medium">
              Ad
            </label>
            <Input
              id="pos-create-name"
              autoComplete="off"
              className={isDark ? 'border-slate-600 bg-slate-950/50 text-slate-100' : ''}
              {...register('name', { required: true })}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="pos-create-desc" className="text-sm font-medium">
              Təsvir
            </label>
            <Input
              id="pos-create-desc"
              autoComplete="off"
              className={isDark ? 'border-slate-600 bg-slate-950/50 text-slate-100' : ''}
              {...register('description', { required: true })}
            />
          </div>
          <div className="flex items-center gap-2">
            <Controller
              name="isActive"
              control={control}
              render={({ field }) => (
                <input
                  id="pos-create-active"
                  type="checkbox"
                  className={checkClass}
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                />
              )}
            />
            <label htmlFor="pos-create-active" className="text-sm font-medium">
              Aktiv
            </label>
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
