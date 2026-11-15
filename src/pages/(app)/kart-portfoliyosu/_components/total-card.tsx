import { useShellTheme } from '@/widgets/app-shell/shell-theme-context';
import { mutedText, panelClass } from '../_utils';

export function TotalCard({ value }: { value: string }) {
  const isDark = useShellTheme();

  return (
    <section
      className={['rounded-xl border px-4 py-2 shadow-lg', panelClass(isDark)].join(' ')}
    >
      <p className={['text-xs font-semibold', mutedText(isDark)].join(' ')}>Cəmi kart</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
    </section>
  );
}
