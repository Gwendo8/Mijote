import { getPublicSettings } from '../../services/auth/authService.js';
import { useLoad } from '../common/useLoad.js';

// Réglages visibles sans compte : { registrationOpen } (afficher ou non « Créer un compte »).
export function usePublicSettings() {
  return useLoad('public-settings', getPublicSettings);
}
