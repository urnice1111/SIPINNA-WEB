import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { api } from '../lib/api';
import type { LoginPayload } from '../lib/api';

type AuthContextValue = {
  name: string | null;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

// Solo se guarda el nombre del usuario; el JWT nunca llega a JavaScript,
// vive exclusivamente en la cookie httpOnly que maneja el backend.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [name, setName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    api
      .me()
      .then((session) => {
        if (!cancelled) setName(session.name);
      })
      .catch(() => {
        if (!cancelled) setName(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    const session = await api.login(payload);
    setName(session.name);
  }, []);

  const logout = useCallback(async () => {
    try {
      // Solo el backend puede borrar la cookie httpOnly.
      await api.logout();
    } finally {
      setName(null);
    }
  }, []);

  const value = useMemo(
    () => ({ name, isLoading, login, logout }),
    [name, isLoading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth debe usarse dentro de un <AuthProvider>');
  }

  return context;
}
