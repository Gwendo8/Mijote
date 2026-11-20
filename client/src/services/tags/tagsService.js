import { apiFetch } from '../api.js';

// Étiquettes (Végé, Rapide…) : créées par l'admin, lisibles par tout compte connecté.
export const listTags = () => apiFetch('/tags');
