import { useCallback } from 'react';
import { updateProfile } from '../../services/me/meService.js';
import { useSession } from '../auth/useSession.js';
import { useAction } from '../common/useAction.js';

export function useUpdateProfile() {
  const { setUser } = useSession();
  const action = useCallback(
    async (values) => {
      const user = await updateProfile(values);
      setUser(user);
      return user;
    },
    [setUser],
  );
  return useAction(action);
}
