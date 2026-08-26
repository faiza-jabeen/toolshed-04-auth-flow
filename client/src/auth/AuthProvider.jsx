import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as auth from './api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // 'booting' until the silent refresh settles — without this the app flashes
  // the login page for a moment on every reload for an already-signed-in user.
  const [status, setStatus] = useState('booting');

  const adopt = useCallback((session) => {
    auth.setAccessToken(session.accessToken);
    setUser(session.user);
    setStatus('authenticated');
    return session.user;
  }, []);

  const clear = useCallback(() => {
    auth.setAccessToken(null);
    setUser(null);
    setStatus('anonymous');
  }, []);

  /** Called on boot, and again whenever a request comes back 401. */
  const silentRefresh = useCallback(async () => {
    try {
      adopt(await auth.refresh());
      return true;
    } catch {
      clear();
      return false;
    }
  }, [adopt, clear]);

  useEffect(() => {
    auth.setUnauthorizedHandler(silentRefresh);
    silentRefresh();
  }, [silentRefresh]);

  const value = useMemo(() => ({
    user,
    status,
    isAuthenticated: status === 'authenticated',
    signup: async (body) => adopt(await auth.signup(body)),
    login:  async (body) => adopt(await auth.login(body)),
    logout: async () => {
      try { await auth.logout(); }        // revokes the refresh token server-side
      finally { clear(); }                // and drops the in-memory one regardless
    },
  }), [user, status, adopt, clear]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>.');
  return ctx;
}
