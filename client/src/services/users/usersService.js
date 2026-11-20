import { apiFetch } from '../api.js';

// Recherche d'une personne par son nom (2 lettres au moins), pour choisir avec qui partager.
export const searchUsers = (q) => apiFetch(`/users/search?q=${encodeURIComponent(q)}`);
