import rateLimit, { MemoryStore } from 'express-rate-limit';

// Compteurs en mémoire, un par limite (vidés par les tests avec resetRateLimits)
const stores = {
  api: new MemoryStore(),
  auth: new MemoryStore(),
  email: new MemoryStore(),
};

export function resetRateLimits() {
  for (const store of Object.values(stores)) store.resetAll();
}

const message = (text) => ({ error: { message: text } });

// Limite générale, par adresse IP, large (listes avec photos, planning...).
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 2000,
  store: stores.api,
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
