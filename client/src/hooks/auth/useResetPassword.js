import { resetPassword } from '../../services/auth/authService.js';
import { useAction } from '../common/useAction.js';

export function useResetPassword() {
  return useAction(resetPassword);
}
