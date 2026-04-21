import { cn } from '@/utils';

export type DataTableActionKind = 'view' | 'edit' | 'delete' | 'assignRole';

export function dataTableActionButtonClass(isDark: boolean, kind: DataTableActionKind): string {
  const cursor = 'cursor-pointer';
  switch (kind) {
    case 'view':
      return cn(
        cursor,
        isDark
          ? 'text-sky-400 hover:bg-sky-950/55 hover:text-sky-200'
          : 'text-sky-600 hover:bg-sky-50 hover:text-sky-800'
      );
    case 'edit':
      return cn(
        cursor,
        isDark
          ? 'text-amber-400 hover:bg-amber-950/50 hover:text-amber-200'
          : 'text-amber-600 hover:bg-amber-50 hover:text-amber-900'
      );
    case 'delete':
      return cn(
        cursor,
        isDark
          ? 'text-red-400 hover:bg-red-950/50 hover:text-red-300'
          : 'text-red-600 hover:bg-red-50 hover:text-red-700'
      );
    case 'assignRole':
      return cn(
        cursor,
        isDark
          ? 'text-violet-400 hover:bg-violet-950/50 hover:text-violet-200'
          : 'text-violet-600 hover:bg-violet-50 hover:text-violet-800'
      );
  }
}
