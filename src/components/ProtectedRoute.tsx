import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<'loading' | 'ok' | 'fail'>('loading');

  useEffect(() => {
    fetch('http://localhost:3000/auth/me', { credentials: 'include' })
      .then((res) => setStatus(res.ok ? 'ok' : 'fail'))
      .catch(() => setStatus('fail'));
  }, []);

  if (status === 'loading') return <p>Cargando...</p>;
  if (status === 'fail') return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default ProtectedRoute;