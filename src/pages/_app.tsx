import { Outlet } from 'react-router-dom';
import { Redirects } from './__redirects';
import { Toaster } from '@/components/toaster';

const App: React.FC = () => {
  return (
    <Redirects>
      {/* Route Outlet/Content */}
      <Outlet />

      {/* Modules */}
      <Toaster />
    </Redirects>
  );
};

export default App;
