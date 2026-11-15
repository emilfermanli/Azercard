import { useShellTheme } from '@/widgets/app-shell/shell-theme-context';
import { mutedText, panelClass } from '../_utils';

type ChartCardProps = {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
  empty?: boolean;
  children: React.ReactNode;
};

export function ChartCard({
  title,
  subtitle,
  action,
  className,
  empty,
  children,
}: ChartCardProps) {
  const isDark = useShellTheme();

  return (
    <section
      className={[
        'flex min-w-0 flex-col rounded-xl border p-4 shadow-lg',
        panelClass(isDark),
        className ?? '',
      ].join(' ')}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-base font-bold">{title}</h2>
          {subtitle && (
            <p className={['mt-0.5 text-xs', mutedText(isDark)].join(' ')}>{subtitle}</p>
          )}
        </div>
        {action}
      </div>
      {empty ? (
        <div
          className={[
            'flex flex-1 items-center justify-center py-10 text-sm',
            mutedText(isDark),
          ].join(' ')}
        >
          Məlumat yoxdur
        </div>
      ) : (
        children
      )}
    </section>
  );
}
