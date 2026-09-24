import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// La cookie de sesión es httpOnly, así que JS no puede leerla: se decide
// con el resultado de /auth/me que ya resuelve AuthContext.
function RootRedirect() {
  const { name, isLoading } = useAuth();

  if (isLoading) return <p>Cargando...</p>;
  return <Navigate to={name === null ? '/login' : '/dashboard'} replace />;
}

export default RootRedirect;
