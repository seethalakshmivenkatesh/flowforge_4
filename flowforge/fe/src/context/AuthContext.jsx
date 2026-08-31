import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authApi } from '../api/endpoints';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('ff_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('ff_token');
    if (!token) {
      setLoading(false);
      return;
    }
    authApi
      .me()
      .then((res) => {
        setUser(res.data.data.user);
        localStorage.setItem('ff_user', JSON.stringify(res.data.data.user));
      })
      .catch(() => {
        localStorage.removeItem('ff_token');
        localStorage.removeItem('ff_user');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await authApi.login({ email, password });
    const { user: u, token } = res.data.data;
    localStorage.setItem('ff_token', token);
    localStorage.setItem('ff_user', JSON.stringify(u));
    setUser(u);
    return u;
  }, []);

  const register = useCallback(async (payload) => {
    const res = await authApi.register(payload);
    const { user: u, token } = res.data.data;
    localStorage.setItem('ff_token', token);
    localStorage.setItem('ff_user', JSON.stringify(u));
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(() => {
    authApi.logout().catch(() => {});
    localStorage.removeItem('ff_token');
    localStorage.removeItem('ff_user');
    setUser(null);
  }, []);

  const updateUser = useCallback((u) => {
    setUser(u);
    localStorage.setItem('ff_user', JSON.stringify(u));
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
