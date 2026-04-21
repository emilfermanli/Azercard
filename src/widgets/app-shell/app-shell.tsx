import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import type { AppDispatch, RootState } from '@/store/index';
import { setAuthUser } from '@/store/features/auth.slice';
import { useGetCurrentUserDataQuery } from '@/services/auth.service';

import { ShellThemeContext } from './shell-theme-context';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';

type Props = {
  children: React.ReactNode;
};

export function AppShell({ children }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isDark, setIsDark] = useState(true);

  const accessToken = useSelector((s: RootState) => s.auth?.data?.accessToken);
  const { data: profileUser } = useGetCurrentUserDataQuery(undefined, {
    skip: !accessToken,
  });

  useEffect(() => {
    if (profileUser) {
      dispatch(setAuthUser(profileUser));
    }
  }, [profileUser, dispatch]);

  return (
    <ShellThemeContext.Provider value={isDark}>
      <div
        className={[
          'flex h-dvh max-h-dvh',
          isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900',
        ].join(' ')}
      >
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
        />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <Topbar isDark={isDark} onToggleTheme={() => setIsDark((d) => !d)} />
          <main
            className={[
              'min-h-0 flex-1 overflow-y-auto p-4 md:p-6',
              isDark ? 'bg-slate-950' : 'bg-slate-100',
            ].join(' ')}
          >
            {children}
          </main>
        </div>
      </div>
    </ShellThemeContext.Provider>
  );
}
