import { Menu } from 'lucide-react';
import { NavLink } from 'react-router-dom';

import { navLinks } from './nav-items';
import { SidebarTooltip } from './sidebar-tooltip';
import { useShellTheme } from '@/widgets/app-shell/shell-theme-context';

type Props = {
  collapsed: boolean;
  onToggleCollapse: () => void;
};

export function Sidebar({ collapsed, onToggleCollapse }: Props) {
  const isDark = useShellTheme();

  const shell = isDark
    ? {
        aside: 'border-slate-800/80 bg-slate-900',
        headerBorder: 'border-slate-800/80',
        menuBtn: 'text-slate-300 hover:bg-slate-800 hover:text-white',
        title: 'text-white',
        subtitle: 'text-slate-500',
        navInactive: 'text-slate-300 hover:bg-slate-800/80 hover:text-white',
        navActive: 'bg-blue-600 text-white shadow-md shadow-blue-900/30',
      }
    : {
        aside: 'border-slate-200 bg-white',
        headerBorder: 'border-slate-200',
        menuBtn: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
        title: 'text-slate-900',
        subtitle: 'text-slate-500',
        navInactive: 'text-slate-700 hover:bg-slate-100 hover:text-slate-900',
        navActive: 'bg-blue-600 text-white shadow-md shadow-blue-600/25',
      };

  return (
    <aside
      className={[
        'flex h-dvh shrink-0 flex-col border-r transition-[width] duration-200 ease-out',
        shell.aside,
        collapsed ? 'w-[4.5rem]' : 'w-[260px]',
      ].join(' ')}
    >
      <div
        className={[
          'flex shrink-0 border-b px-3',
          shell.headerBorder,
          collapsed
            ? 'flex-col items-center gap-2 py-3'
            : 'h-14 items-center gap-2',
        ].join(' ')}
      >
        <button
          type="button"
          onClick={onToggleCollapse}
          className={[
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors',
            shell.menuBtn,
          ].join(' ')}
          aria-label={collapsed ? 'Menyunu genişlət' : 'Menyunu yığ'}
        >
          <Menu className="h-5 w-5" />
        </button>
        {!collapsed && (
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
              PM
            </span>
            <div className="min-w-0">
              <p className={`truncate text-sm font-semibold ${shell.title}`}>İdarəetmə Paneli</p>
              <p className={`truncate text-xs ${shell.subtitle}`}>İdarəetmə Sistemi</p>
            </div>
          </div>
        )}
        {collapsed && (
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
            PM
          </span>
        )}
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto overflow-x-visible px-2 py-4">
        <ul className="space-y-1">
          {navLinks.map((item) => (
            <li key={item.path}>
              <SidebarTooltip label={item.label} collapsed={collapsed}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    [
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                      collapsed ? 'justify-center px-2' : '',
                      isActive ? shell.navActive : shell.navInactive,
                    ].join(' ')
                  }
                >
                  <item.icon className="h-5 w-5 shrink-0 opacity-90" aria-hidden />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </NavLink>
              </SidebarTooltip>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
