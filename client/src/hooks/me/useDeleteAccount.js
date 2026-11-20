import { useCallback } from 'react';
import { deleteAccount } from '../../services/me/meService.js';
import { useSession } from '../auth/useSession.js';
import { useAction } from '../common/useAction.js';

export function useDeleteAccount() {
  const { setUser } = useSession();
  const action = useCallback(
    async (password) => {
      await deleteAccount(password);
      setUser(null);
    },
    [setUser],
  );
  return useAction(action);
}
