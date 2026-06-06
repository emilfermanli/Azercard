import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

import { cn } from '@/utils';
import { useShellTheme } from '@/widgets/app-shell/shell-theme-context';

import { Button } from './button';

type DataPaginationProps = {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  isFetching?: boolean;
  onPageChange: (page: number) => void;
};

type PaginationItem = number | 'left-ellipsis' | 'right-ellipsis';

function getPaginationItems(page: number, totalPages: number): PaginationItem[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (page <= 4) {
    return [1, 2, 3, 4, 5, 'right-ellipsis', totalPages];
  }

  if (page >= totalPages - 3) {
    return [
      1,
      'left-ellipsis',
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  return [1, 'left-ellipsis', page - 1, page, page + 1, 'right-ellipsis', totalPages];
}

export function DataPagination({
  page,
  pageSize,
  totalCount,
  totalPages,
  hasNext,
  hasPrev,
  isFetching = false,
  onPageChange,
}: DataPaginationProps) {
  const isDark = useShellTheme();
  const safeTotalPages = Math.max(totalPages, 1);
  const safePage = Math.min(Math.max(page, 1), safeTotalPages);
  const start = totalCount === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const end = Math.min(safePage * pageSize, totalCount);
  const pages = getPaginationItems(safePage, safeTotalPages);
  const outlineButtonClass = isDark
    ? 'border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800 hover:text-slate-100'
    : undefined;
  const pageButtonClass = (isActive: boolean) =>
    cn(
      'h-8 min-w-8 px-2 tabular-nums',
      isActive
        ? 'border-blue-500 bg-blue-500 text-white hover:bg-blue-600 hover:text-white'
        : outlineButtonClass
    );

  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm',
        isDark
          ? 'border-slate-800 bg-slate-900/70 text-slate-300'
          : 'border-slate-200 bg-white text-slate-600'
      )}
    >
      <p>
        {start}-{end} / {totalCount} qeyd
        {isFetching ? ' yenilənir...' : ''}
      </p>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button
          aria-label="İlk səhifə"
          className={outlineButtonClass}
          disabled={!hasPrev || isFetching}
          onClick={() => onPageChange(1)}
          size="icon"
          type="button"
          variant="outline"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          aria-label="Əvvəlki səhifə"
          className={outlineButtonClass}
          disabled={!hasPrev || isFetching}
          onClick={() => onPageChange(safePage - 1)}
          size="icon"
          type="button"
          variant="outline"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex flex-wrap items-center gap-1">
          {pages.map((item) =>
            typeof item === 'number' ? (
              <Button
                key={item}
                aria-current={item === safePage ? 'page' : undefined}
                className={pageButtonClass(item === safePage)}
                disabled={isFetching || item === safePage}
                onClick={() => onPageChange(item)}
                size="sm"
                type="button"
                variant="outline"
              >
                {item}
              </Button>
            ) : (
              <span
                key={item}
                className={cn(
                  'flex h-8 min-w-8 items-center justify-center px-1',
                  isDark ? 'text-slate-500' : 'text-slate-400'
                )}
              >
                ...
              </span>
            )
          )}
        </div>

        <Button
          aria-label="Növbəti səhifə"
          className={outlineButtonClass}
          disabled={!hasNext || isFetching}
          onClick={() => onPageChange(safePage + 1)}
          size="icon"
          type="button"
          variant="outline"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          aria-label="Son səhifə"
          className={outlineButtonClass}
          disabled={!hasNext || isFetching}
          onClick={() => onPageChange(safeTotalPages)}
          size="icon"
          type="button"
          variant="outline"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
