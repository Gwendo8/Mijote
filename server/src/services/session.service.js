import { randomBytes } from 'node:crypto';
import * as sessionsRepository from '../repositories/sessions.repository.js';
import { hashToken } from '../utils/tokens.js';

// Une session = une ligne de la table `sessions` (un appareil connecté).
// - Le cookie contient un jeton aléatoire ; la base ne garde que son empreinte SHA-256.
// - Valable 6 mois, prolongé à chaque visite (au plus une fois par jour) : la session « glisse ».
// - Changer de mot de passe ferme les autres appareils ; « Me déconnecter partout » les ferme tous.

export const SESSION_DURATION_MS = 180 * 24 * 60 * 60 * 1000;
const RENEW_AFTER_MS = 24 * 60 * 60 * 1000;

// Crée la session d'un appareil. Renvoie le jeton à mettre dans le cookie.
export async function createSession(userId) {
  const token = randomBytes(32).toString('base64url');
  const now = new Date();
  await sessionsRepository.create({
    userId,
    tokenHash: hashToken(token),
    expiresAt: new Date(now.getTime() + SESSION_DURATION_MS),
    lastUsedAt: now,
  });
  return token;
}

// Lit un cookie : renvoie { user, sessionId, renewed } ou null si la session n'existe plus ou a expiré.
// renewed = true quand la session a été prolongée (le cookie doit être renvoyé avec une durée neuve).
export async function resolveSession(token) {
  const session = await sessionsRepository.findWithUser(hashToken(token));
  if (!session) return null;

  const now = Date.now();
  if (session.expiresAt.getTime() <= now) {
    await sessionsRepository.removeById(session.id);
    return null;
  }

  let renewed = false;
  if (now - session.lastUsedAt.getTime() > RENEW_AFTER_MS) {
    await sessionsRepository.touch(session.id, {
      lastUsedAt: new Date(now),
      expiresAt: new Date(now + SESSION_DURATION_MS),
    });
    renewed = true;
  }

  return { user: session.user, sessionId: session.id, renewed };
}

export const endSession = (sessionId) => sessionsRepository.removeById(sessionId);
export const endAllSessions = (userId) => sessionsRepository.removeAllOfUser(userId);
export const endOtherSessions = (userId, keepSessionId, options) =>
  sessionsRepository.removeOthersOfUser(userId, keepSessionId, options);
