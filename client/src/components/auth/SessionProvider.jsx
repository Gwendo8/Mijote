import { Outlet } from 'react-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { SessionContext } from '../../hooks/auth/sessionContext.js';
import { ApiError, UNAUTHORIZED_EVENT } from '../../services/api.js';
import { getMe } from '../../services/auth/authService.js';

// Demande « qui suis-je ? » au chargement (GET /api/auth/me : 200 = connecté, 401 = non) et garde la réponse.
// Le front ne stocke rien : le cookie de session est géré par le navigateur et le serveur.
export default function SessionProvider() {
  const [session, setSession] = useState({ status: 'loading', user: null });

  const check = useCallback(() => {
    return getMe()
      .then((user) => setSession({ status: 'authenticated', user }))
      .catch((error) => {
        const anonymous = error instanceof ApiError && error.status === 401;
        setSession({ status: anonymous ? 'anonymous' : 'error', user: null });
      });
  }, []);

  useEffect(() => {
    check();
    // Une route a répondu 401 : si la session a vraiment expiré, /auth/me le confirme et on revient à la connexion.
    // (Un 401 « mauvais mot de passe » ne change rien : /auth/me répond encore 200.)
    window.addEventListener(UNAUTHORIZED_EVENT, check);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, check);
  }, [check]);

  const setUser = useCallback(
    (user) => setSession({ status: user ? 'authenticated' : 'anonymous', user }),
    [],
  );
  const retry = useCallback(() => {
    setSession({ status: 'loading', user: null });
    check();
  }, [check]);

  const value = useMemo(() => ({ ...session, setUser, retry }), [session, setUser, retry]);
  return (
    <SessionContext.Provider value={value}>
      <Outlet />
    </SessionContext.Provider>
  );
}
