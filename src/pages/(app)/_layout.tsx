import { Outlet } from 'react-router-dom';

import { AppShell } from '@/widgets/app-shell';

const Layout: React.FC = () => {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
};

export default Layout;
