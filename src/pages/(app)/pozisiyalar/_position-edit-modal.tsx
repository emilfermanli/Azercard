import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { X } from 'lucide-react';

import { Button, Input, LoadingSpinner } from '@/components';
import type { UpdatePositionPayload } from '@/types/organization.type';
import {
  useGetPositionByIdQuery,
  useUpdatePositionMutation,
} from '@/services/organization.service';
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
  positionId: string | null;
  onClose: () => void;
};

export function PositionEditModal({ open, positionId, onClose }: Props) {
  const isDark = useShellTheme();
  const skip = !open || !positionId;
  const { data, isLoading, isError } = useGetPositionByIdQuery(positionId ?? '', { skip });
  const [updatePosition, { isLoading: isSaving }] = useUpdatePositionMutation();
  const { register, handleSubmit, reset, control } = useForm<FormValues>({
    defaultValues: {
      id: '',
      name: '',
      description: '',
      isActive: true,
    },
  });

  useEffect(() => {
    if (!open) {
      reset({
        id: '',
        name: '',
        description: '',
        isActive: true,
      });
      return;
    }
    if (data) {
      reset({
        id: data.id,
        name: data.name,
        description: data.description ?? '',
        isActive: data.isActive,
      });
    }
  }, [open, positionId, data, reset]);

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

  if (!open || !positionId) return null;

  const panel = isDark
    ? 'border-slate-600 bg-slate-900 text-slate-100 shadow-2xl'
    : 'border-slate-200 bg-white text-slate-900 shadow-xl';

  const muted = isDark ? 'text-slate-400' : 'text-slate-500';

  const onSubmit = handleSubmit(async (values) => {
    if (!positionId) return;
    try {
      const payload: UpdatePositionPayload = {
        id: positionId,
        name: values.name.trim(),
        description: values.description.trim(),
        isActive: values.isActive,
      };
      await updatePosition(payload).unwrap();
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
      aria-labelledby="pos-edit-title"
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
          <h2 id="pos-edit-title" className="text-lg font-semibold">
            Pozisiyanı redaktə et
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
              <label htmlFor="pos-edit-name" className="text-sm font-medium">
                Ad
              </label>
              <Input
                id="pos-edit-name"
                autoComplete="off"
                className={isDark ? 'border-slate-600 bg-slate-950/50 text-slate-100' : ''}
                {...register('name', { required: true })}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="pos-edit-desc" className="text-sm font-medium">
                Təsvir
              </label>
              <Input
                id="pos-edit-desc"
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
                    id="pos-edit-active"
                    type="checkbox"
                    className={checkClass}
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                  />
                )}
              />
              <label htmlFor="pos-edit-active" className="text-sm font-medium">
                Aktiv
              </label>
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
