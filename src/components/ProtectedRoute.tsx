import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { getMe } from '../lib/api';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<'loading' | 'ok' | 'fail'>('loading');

  useEffect(() => {
    getMe().then((ok) => setStatus(ok ? 'ok' : 'fail'));
  }, []);

  if (status === 'loading') return <p>Cargando...</p>;
  if (status === 'fail') return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default ProtectedRoute;