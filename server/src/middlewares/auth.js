import { env } from '../config/env.js';
import { resolveSession, SESSION_DURATION_MS } from '../services/session.service.js';
import { HttpError } from '../utils/HttpError.js';

export const SESSION_COOKIE = 'mijote_session';

const cookieOptions = {
  httpOnly: true, // illisible par le JavaScript du front : un script malveillant ne peut pas le voler
  sameSite: 'lax', // pas envoyé par les formulaires d'autres sites (protège des requêtes forgées)
  secure: env.NODE_ENV === 'production', // HTTPS uniquement en production
  path: '/',
};

export function setSessionCookie(res, token) {
  res.cookie(SESSION_COOKIE, token, { ...cookieOptions, maxAge: SESSION_DURATION_MS });
}

export function clearSessionCookie(res) {
  res.clearCookie(SESSION_COOKIE, cookieOptions);
}

// Sur toutes les routes : si le cookie correspond à une session valable, req.user et req.sessionId sont remplis.
// Ne bloque rien : c'est requireAuth qui refuse les personnes non connectées.
export async function authenticate(req, res, next) {
  const token = req.cookies?.[SESSION_COOKIE];
  if (!token) return next();

  const session = await resolveSession(token);
  if (!session) {
    clearSessionCookie(res);
    return next();
  }

  req.user = session.user;
  req.sessionId = session.sessionId;
  if (session.renewed) setSessionCookie(res, token);
  next();
}

export function requireAuth(req, res, next) {
  if (!req.user) return next(new HttpError(401, 'Connecte-toi pour continuer'));
  next();
}

export function requireAdmin(req, res, next) {
  if (!req.user) return next(new HttpError(401, 'Connecte-toi pour continuer'));
  if (req.user.role !== 'admin') return next(new HttpError(403, 'Réservé aux administrateurs'));
  next();
}
