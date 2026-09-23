import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { name, isLoading } = useAuth();

  if (isLoading) return <p>Cargando...</p>;
  if (name === null) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default ProtectedRoute;
