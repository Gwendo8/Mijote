import request from 'supertest';
import app from '../src/app.js';
import { sentEmails } from '../src/integrations/mailer.js';
import { resetRateLimits } from '../src/middlewares/rateLimits.js';
import { Food, Invitation, sequelize, User } from '../src/models/index.js';
import { hashPassword } from '../src/utils/password.js';
import { generateToken } from '../src/utils/tokens.js';

export const PASSWORD = 'Motdepasse1!';

// À appeler dans beforeEach : base vide, compteurs de limites et e-mails remis à zéro
export async function resetAll() {
  await sequelize.truncate({ cascade: true, restartIdentity: true });
  resetRateLimits();
  sentEmails.length = 0;
}

export async function createUser({
  email = 'gwen@example.fr',
  password = PASSWORD,
  displayName = 'Gwen',
  role = 'user',
} = {}) {
  return User.create({ email, displayName, role, passwordHash: await hashPassword(password) });
}

// Navigateur de test connecté (garde le cookie de session entre les requêtes)
export async function loginAgent(user, password = PASSWORD) {
  const agent = request.agent(app);
  await agent.post('/api/auth/login').send({ email: user.email, password }).expect(200);
  return agent;
}

export async function createInvitation({
  email = 'ami@example.fr',
  expiresInMs = 86_400_000,
} = {}) {
  const { token, tokenHash } = generateToken();
  const invitation = await Invitation.create({
    email,
    tokenHash,
    expiresAt: new Date(Date.now() + expiresInMs),
  });
  return { token, invitation };
}

// Jeton contenu dans le dernier e-mail « envoyé »
export function lastEmailToken() {
  const email = sentEmails.at(-1);
  return email?.text.match(/token=([\w-]+)/)?.[1];
}

// Raccourci : un compte admin
export const createAdmin = (overrides = {}) =>
  createUser({ email: 'admin@example.fr', displayName: 'Admin', role: 'admin', ...overrides });

// Un aliment directement en base (par défaut : Ciqual)
export function createFood({ name = 'Poulet, blanc, cuit', ...data } = {}) {
  return Food.create({
    source: 'ciqual',
    name,
    searchName: name.toLowerCase(),
    energyKcal: 151,
    proteinsG: 29.8,
    carbsG: 0,
    fatsG: 3.5,
    ...data,
  });
}
