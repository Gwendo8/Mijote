import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);

// Hachage des mots de passe avec scrypt (intégré à Node, pas de dépendance) :
// volontairement lent et « salé » (une valeur aléatoire par mot de passe), pour qu'une fuite de la base
// ne permette pas de retrouver les mots de passe.
// Format stocké : scrypt$N$r$p$sel$empreinte (les paramètres sont gardés pour pouvoir les changer plus tard).
const PARAMS = { N: 16384, r: 8, p: 1 };
const KEY_LENGTH = 64;

export async function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = await scryptAsync(password, salt, KEY_LENGTH, PARAMS);
  const { N, r, p } = PARAMS;
  return `scrypt$${N}$${r}$${p}$${salt.toString('base64')}$${hash.toString('base64')}`;
}

export async function verifyPassword(password, stored) {
  const parts = typeof stored === 'string' ? stored.split('$') : [];
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;

  const [, N, r, p, salt, expected] = parts;
  const expectedBuffer = Buffer.from(expected, 'base64');
  const hash = await scryptAsync(password, Buffer.from(salt, 'base64'), expectedBuffer.length, {
    N: Number(N),
    r: Number(r),
    p: Number(p),
  });
  // Comparaison en temps constant : ne révèle pas, par sa durée, combien de caractères correspondent
  return timingSafeEqual(hash, expectedBuffer);
}
