import { LoadingIcon } from '@/assets/icons';

import { cn } from '@/utils';

const sizeClass = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-8 w-8',
} as const;

export type LoadingSpinnerProps = {
  className?: string;
  size?: keyof typeof sizeClass;
};

export function LoadingSpinner({ className, size = 'md' }: LoadingSpinnerProps) {
  return (
    <span
      className={cn('inline-flex shrink-0 items-center justify-center text-current', className)}
      role="status"
      aria-busy="true"
    >
      <span className="sr-only">Məzmun hazırlanır</span>
      <LoadingIcon className={cn('animate-spin', sizeClass[size])} aria-hidden />
    </span>
  );
}

type LoadingProps = {
  className?: string;
  size?: keyof typeof sizeClass;
};

export function Loading({ className, size = 'lg' }: LoadingProps) {
  return (
    <div
      className={cn('flex flex-1 items-center justify-center py-10', className)}
      role="status"
      aria-busy="true"
    >
      <LoadingSpinner size={size} />
    </div>
  );
}
