import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { PageSpinner } from '../components/ui/Spinner.jsx';

export function AdminRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <PageSpinner />;
  if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
