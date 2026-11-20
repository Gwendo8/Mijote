import { getInvitation } from '../../services/auth/authService.js';
import { useLoad } from '../common/useLoad.js';

// Lit un lien d'invitation (sert à préremplir l'e-mail). Sans jeton : rien à charger.
export function useInvitation(token) {
  return useLoad(token || null, () => getInvitation(token));
}
