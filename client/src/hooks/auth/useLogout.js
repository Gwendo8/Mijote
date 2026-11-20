import { useCallback } from 'react';
import { logout, logoutAll } from '../../services/auth/authService.js';
import { useAction } from '../common/useAction.js';
import { useSession } from './useSession.js';

// « Se déconnecter » (cet appareil) ou, avec everywhere = true, « Me déconnecter partout ».
export function useLogout(everywhere = false) {
  const { setUser } = useSession();
  const action = useCallback(async () => {
    await (everywhere ? logoutAll() : logout());
    setUser(null);
  }, [everywhere, setUser]);
  return useAction(action);
}
