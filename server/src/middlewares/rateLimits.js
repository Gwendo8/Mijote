import rateLimit, { MemoryStore } from 'express-rate-limit';

// Compteurs en mémoire, un par limite (vidés par les tests avec resetRateLimits)
const stores = {
  api: new MemoryStore(),
  auth: new MemoryStore(),
  email: new MemoryStore(),
  off: new MemoryStore(),
  import: new MemoryStore(),
  photos: new MemoryStore(),
};

export function resetRateLimits() {
  for (const store of Object.values(stores)) store.resetAll();
}

// Adresse d'une photo de recette, vue depuis /api
const PHOTO_PATH = /^\/recipes\/\d+\/photo$/;

const message = (text) => ({ error: { message: text } });

// Limite générale, par adresse IP, large (listes avec photos, planning...).
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 2000,
  store: stores.api,
  // Les photos ont leur propre compteur (photoLimiter) : une liste de recettes en charge une par recette
  skip: (req) => req.method === 'GET' && PHOTO_PATH.test(req.path),
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: message('Trop de requêtes, réessaie dans quelques minutes'),
});

// Connexion, inscription, liens reçus par e-mail : empêche d'essayer des mots de passe ou des jetons en boucle.
// Seuls les échecs comptent (une connexion réussie ne consomme rien).
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  store: stores.auth,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: message('Trop de tentatives, réessaie dans 15 minutes'),
});

// Demandes qui envoient un e-mail (mot de passe oublié) : 5 par 15 minutes, réussies ou non,
// pour qu'on ne puisse pas inonder une boîte mail.
export const emailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  store: stores.email,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: message('Trop de demandes, réessaie dans 15 minutes'),
});

// Routes qui interrogent Open Food Facts (qui limite aussi ses visiteurs) : 20 par minute, réussies ou non.
export const offLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  store: stores.off,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: message('Trop de recherches Open Food Facts, réessaie dans une minute'),
});

// Import d'une recette par lien : le serveur va chercher une page sur Internet, 20 par minute.
export const importLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  store: stores.import,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: message('Trop d’imports, réessaie dans une minute'),
});

// Lecture des photos de recettes : compteur à part du compteur général.
export const photoLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 3000,
  store: stores.photos,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: message('Trop de requêtes, réessaie dans quelques minutes'),
});
