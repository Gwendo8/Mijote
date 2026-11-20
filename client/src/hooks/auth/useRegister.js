import { useCallback } from 'react';
import { register } from '../../services/auth/authService.js';
import { useAction } from '../common/useAction.js';
import { useSession } from './useSession.js';

// L'inscription connecte tout de suite (l'API pose le cookie de session).
export function useRegister() {
  const { setUser } = useSession();
  const action = useCallback(
    async (values) => {
      const user = await register(values);
      setUser(user);
      return user;
    },
    [setUser],
  );
  return useAction(action);
}
