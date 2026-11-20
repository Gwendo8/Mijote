import { createHash, randomBytes } from 'node:crypto';

// Jetons des liens envoyés par e-mail (invitation, mot de passe oublié).
// Le jeton part dans l'e-mail ; la base ne garde que son empreinte SHA-256 :
// quelqu'un qui lirait la base ne pourrait pas s'en servir.

export function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

export function generateToken() {
  const token = randomBytes(32).toString('base64url');
  return { token, tokenHash: hashToken(token) };
}
