import { changePassword } from '../../services/me/meService.js';
import { useAction } from '../common/useAction.js';

export function useChangePassword() {
  return useAction(changePassword);
}
