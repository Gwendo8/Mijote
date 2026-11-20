import { getResetLink } from '../../services/auth/authService.js';
import { useLoad } from '../common/useLoad.js';

// Lit un lien « mot de passe oublié » : à qui il sert (e-mail) et jusqu'à quand. Sans jeton : rien à charger.
export function useResetLink(token) {
  return useLoad(token || null, () => getResetLink(token));
}
