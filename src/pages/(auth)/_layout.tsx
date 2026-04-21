import { Outlet } from 'react-router-dom';

const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-dvh flex flex-col">
      <Outlet />
    </div>
  );
};

export default AuthLayout;
