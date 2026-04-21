import type { AppDispatch, RootState } from '@/store/index';

import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Bell, ChevronDown, LogOut, Moon, Search, Sun } from 'lucide-react';

import { authApi } from '@/services/auth.service';
import { logout } from '@/store/features/auth.slice';

type Props = {
  isDark: boolean;
  onToggleTheme: () => void;
};

function initialsFromUserName(name: string): string {
  const s = name.trim();
  if (!s) return '?';
  if (s.length === 1) return s.toUpperCase();
  return (s[0]! + s[1]!).toUpperCase();
}

export function Topbar({ isDark, onToggleTheme }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const auth = useSelector((state: RootState) => state.auth);
  const user = auth?.data?.user;
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const displayName = user?.username?.trim() || user?.name?.trim() || 'Hesab';
  const roleLabel = user?.role?.name ?? '—';
  const initials = initialsFromUserName(displayName);

  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [menuOpen]);

  const handleLogout = () => {
    setMenuOpen(false);
    dispatch(logout());
    dispatch(authApi.util.invalidateTags([{ type: 'CurrentUser', id: 'ME' }]));
  };

  return (
    <header
      className={[
        'flex h-14 shrink-0 items-center gap-3 border-b px-4 md:px-6',
        isDark
          ? 'border-slate-800/80 bg-slate-900/80 text-slate-100 backdrop-blur-md'
          : 'border-slate-200 bg-white/90 text-slate-900 backdrop-blur-md',
      ].join(' ')}
    >
      <div className="relative min-w-0 flex-1 max-w-2xl">
        <Search
          className={[
            'pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2',
            isDark ? 'text-slate-500' : 'text-slate-400',
          ].join(' ')}
          aria-hidden
        />
        <input
          type="search"
          placeholder="Axtar..."
          className={[
            'h-10 w-full rounded-lg border py-2 pl-10 pr-3 text-sm outline-none ring-blue-500/40 transition focus:ring-2',
            isDark
              ? 'border-slate-700 bg-slate-950/80 text-slate-100 placeholder:text-slate-500'
              : 'border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400',
          ].join(' ')}
        />
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
        <button
          type="button"
          onClick={onToggleTheme}
          className={[
            'flex h-10 w-10 items-center justify-center rounded-lg border transition',
            isDark
              ? 'border-slate-700 bg-slate-800/60 text-amber-300 hover:bg-slate-800'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
          ].join(' ')}
          aria-label={isDark ? 'İşıqlı mövzu' : 'Qaranlıq mövzu'}
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        <button
          type="button"
          className={[
            'relative flex h-10 w-10 items-center justify-center rounded-lg border transition',
            isDark
              ? 'border-slate-700 bg-slate-800/60 text-slate-200 hover:bg-slate-800'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
          ].join(' ')}
          aria-label="Bildirişlər"
        >
          <Bell className="h-4 w-4" />
          <span
            className={[
              'absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2',
              isDark ? 'ring-slate-900' : 'ring-white',
            ].join(' ')}
          />
        </button>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            className={[
              'flex items-center gap-2 rounded-lg border px-2 py-1.5 text-left text-sm transition',
              isDark
                ? 'border-slate-700 bg-slate-800/60 text-slate-200 hover:bg-slate-800'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
            ].join(' ')}
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
              {initials}
            </span>
            <span className="min-w-0 max-w-[10rem]">
              <span className="block truncate font-medium leading-tight">{displayName}</span>
              <span
                className={[
                  'block truncate text-xs leading-tight',
                  isDark ? 'text-slate-400' : 'text-slate-500',
                ].join(' ')}
              >
                {roleLabel}
              </span>
            </span>
            <ChevronDown
              className={['h-4 w-4 shrink-0 opacity-70 transition', menuOpen ? 'rotate-180' : ''].join(
                ' '
              )}
            />
          </button>

          {menuOpen && (
            <div
              role="menu"
              className={[
                'absolute right-0 z-[100] mt-1 min-w-[11rem] overflow-hidden rounded-lg border py-1 shadow-xl',
                isDark
                  ? 'border-slate-700 bg-slate-900 text-slate-100'
                  : 'border-slate-200 bg-white text-slate-900',
              ].join(' ')}
            >
              <button
                type="button"
                role="menuitem"
                onClick={handleLogout}
                className={[
                  'flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition',
                  isDark ? 'hover:bg-red-950/50 hover:text-red-200' : 'hover:bg-red-50 hover:text-red-700',
                ].join(' ')}
              >
                <LogOut className="h-4 w-4 shrink-0" />
                Çıxış
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
