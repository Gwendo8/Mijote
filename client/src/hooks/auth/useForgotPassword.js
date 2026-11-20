import { forgotPassword } from '../../services/auth/authService.js';
import { useAction } from '../common/useAction.js';

export function useForgotPassword() {
  return useAction(forgotPassword);
}
