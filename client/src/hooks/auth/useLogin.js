import { useCallback } from 'react';
import { login } from '../../services/auth/authService.js';
import { useAction } from '../common/useAction.js';
import { useSession } from './useSession.js';

export function useLogin() {
  const { setUser } = useSession();
  const action = useCallback(
    async (values) => {
      const user = await login(values);
      setUser(user);
      return user;
    },
    [setUser],
  );
  return useAction(action);
}
