import { type LucideIcon } from 'lucide-react';

import { LoadingSpinner } from '@/components';
import { useShellTheme } from '@/widgets/app-shell/shell-theme-context';

type PageHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
  tone?: 'blue' | 'cyan' | 'emerald' | 'violet' | 'amber';
};

const toneClass = {
  blue: {
    text: 'text-blue-500',
    iconDark: 'bg-blue-500/15 text-blue-300',
    iconLight: 'bg-blue-50 text-blue-700',
  },
  cyan: {
    text: 'text-cyan-500',
    iconDark: 'bg-cyan-500/15 text-cyan-300',
    iconLight: 'bg-cyan-50 text-cyan-700',
  },
  emerald: {
    text: 'text-emerald-500',
    iconDark: 'bg-emerald-500/15 text-emerald-300',
    iconLight: 'bg-emerald-50 text-emerald-700',
  },
  violet: {
    text: 'text-violet-500',
    iconDark: 'bg-violet-500/15 text-violet-300',
    iconLight: 'bg-violet-50 text-violet-700',
  },
  amber: {
    text: 'text-amber-500',
    iconDark: 'bg-amber-500/15 text-amber-300',
    iconLight: 'bg-amber-50 text-amber-700',
  },
};

export function DataPageHeader({
  eyebrow,
  title,
  description,
  icon: Icon,
  tone = 'blue',
}: PageHeaderProps) {
  const isDark = useShellTheme();
  const panel = isDark
    ? 'border-slate-800 bg-slate-900/70 shadow-black/20'
    : 'border-slate-200 bg-white shadow-slate-200/70';
  const selectedTone = toneClass[tone];

  return (
    <div className={['rounded-xl border p-4 shadow-lg sm:p-5', panel].join(' ')}>
      <div className="flex items-start gap-4">
        <span
          className={[
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-lg',
            isDark ? selectedTone.iconDark : selectedTone.iconLight,
          ].join(' ')}
        >
          <Icon className="h-6 w-6" />
        </span>
        <div>
          <p className={['text-xs font-semibold uppercase', selectedTone.text].join(' ')}>
            {eyebrow}
          </p>
          <h1
            className={[
              'mt-1 text-2xl font-semibold tracking-tight',
              isDark ? 'text-white' : 'text-slate-950',
            ].join(' ')}
          >
            {title}
          </h1>
          <p
            className={[
              'mt-2 max-w-3xl text-sm leading-6',
              isDark ? 'text-slate-300' : 'text-slate-500',
            ].join(' ')}
          >
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

export function StatCard({ label, value }: { label: string; value: string | number }) {
  const isDark = useShellTheme();
  return (
    <div
      className={[
        'rounded-xl border p-4',
        isDark
          ? 'border-slate-800 bg-slate-900/60 text-slate-100'
          : 'border-slate-200 bg-white text-slate-900 shadow-sm',
      ].join(' ')}
    >
      <p
        className={[
          'text-sm font-medium',
          isDark ? 'text-slate-300' : 'text-slate-500',
        ].join(' ')}
      >
        {label}
      </p>
      <p className="mt-2 text-3xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

export function PageLoading() {
  const isDark = useShellTheme();
  return (
    <div
      className={[
        'flex justify-center rounded-xl border py-12',
        isDark ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-white',
      ].join(' ')}
    >
      <LoadingSpinner
        size="lg"
        className={isDark ? 'text-slate-400' : 'text-slate-500'}
      />
    </div>
  );
}

export function PageError() {
  return (
    <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
      Məlumat yüklənərkən xəta baş verdi.
    </p>
  );
}

export function formatNumber(value: number | null | undefined) {
  return Number(value ?? 0).toLocaleString('az-AZ');
}

export function formatAmount(value: number | null | undefined) {
  return Number(value ?? 0).toLocaleString('az-AZ', {
    maximumFractionDigits: 2,
  });
}

export { formatDate } from '@/utils/date-format';
