import { useShellTheme } from '@/widgets/app-shell/shell-theme-context';

type Props = {
  label: string;
  collapsed: boolean;
  children: React.ReactNode;
};

export function SidebarTooltip({ label, collapsed, children }: Props) {
  const isDark = useShellTheme();

  if (!collapsed) {
    return <>{children}</>;
  }

  return (
    <span className="group/tooltip relative flex justify-center">
      {children}
      <span
        role="tooltip"
        className={[
          'pointer-events-none absolute left-full top-1/2 z-[200] ml-3 -translate-y-1/2 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-medium opacity-0 shadow-lg transition-opacity duration-150 group-hover/tooltip:opacity-100 group-focus-visible/tooltip:opacity-100',
          isDark
            ? 'bg-slate-800 text-white ring-1 ring-white/10'
            : 'bg-slate-900 text-white ring-1 ring-slate-700/30',
        ].join(' ')}
      >
        {label}
      </span>
    </span>
  );
}
