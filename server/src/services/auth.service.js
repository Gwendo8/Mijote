import { UniqueConstraintError } from 'sequelize';
import { sendEmail } from '../integrations/mailer.js';
import * as invitationsRepository from '../repositories/invitations.repository.js';
import * as mealSlotsRepository from '../repositories/meal-slots.repository.js';
import * as resetTokensRepository from '../repositories/password-reset-tokens.repository.js';
import * as sessionsRepository from '../repositories/sessions.repository.js';
import * as settingsRepository from '../repositories/settings.repository.js';
import { inTransaction } from '../repositories/transactions.js';
import * as usersRepository from '../repositories/users.repository.js';
import { HttpError } from '../utils/HttpError.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { generateToken, hashToken } from '../utils/tokens.js';
import { passwordResetEmail } from './emails.js';
import { createSession, endAllSessions } from './session.service.js';

const RESET_VALID_MS = 60 * 60 * 1000; // mot de passe oublié : 1 heure

// Un compte sans donnée sensible, tel qu'il est renvoyé au front.
export function toPublicUser(user) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    createdAt: user.createdAt,
  };
}

// Faux hachage vérifié quand l'adresse est inconnue : la réponse prend le même temps, donc on ne peut pas
// deviner quelles adresses ont un compte en chronométrant la connexion.
const dummyHash = hashPassword('mot-de-passe-factice');

export async function login({ email, password }) {
  const user = await usersRepository.findByEmailWithPassword(email);
  const ok = await verifyPassword(password, user ? user.passwordHash : await dummyHash);
  if (!user || !ok) throw new HttpError(401, 'Adresse e-mail ou mot de passe incorrect');

  const token = await createSession(user.id);
  return { user: toPublicUser(user), token };
}

// Crée le compte et ses 4 créneaux par défaut d'un seul bloc. Un rôle `admin` n'est utilisé que par le script
// `npm run admin:create` ; l'inscription crée toujours un `user`.
async function createAccount({ email, password, firstName, lastName, role = 'user', invitation }) {
  const passwordHash = await hashPassword(password);
  try {
    return await inTransaction(async (transaction) => {
      const user = await usersRepository.create(
        { email, passwordHash, firstName, lastName, role },
        { transaction },
      );
      await mealSlotsRepository.createDefaults(user.id, { transaction });
      if (invitation) await invitationsRepository.markAccepted(invitation.id, { transaction });
      return user;
    });
  } catch (error) {
    // Deux inscriptions simultanées avec la même adresse : la base refuse la seconde
    if (error instanceof UniqueConstraintError) {
      throw new HttpError(409, 'Cette adresse est déjà utilisée');
    }
    throw error;
  }
}

export async function createAdminAccount({ email, password, firstName, lastName }) {
  if (await usersRepository.findByEmail(email)) {
    throw new HttpError(409, 'Cette adresse est déjà utilisée');
  }
  return toPublicUser(await createAccount({ email, password, firstName, lastName, role: 'admin' }));
}

// Invitation encore utilisable (existe, pas acceptée, pas expirée), sinon 404.
async function findUsableInvitation(token) {
  const invitation = await invitationsRepository.findByTokenHash(hashToken(token));
  if (!invitation || invitation.acceptedAt || invitation.expiresAt.getTime() <= Date.now()) {
    throw new HttpError(404, 'Invitation invalide ou expirée');
  }
  return invitation;
}

export async function getInvitation(token) {
  const invitation = await findUsableInvitation(token);
  return { email: invitation.email, expiresAt: invitation.expiresAt };
}

export async function register({ token, email, password, firstName, lastName }) {
  let invitation = null;
  if (token) {
    invitation = await findUsableInvitation(token);
  } else if (!(await settingsRepository.get()).registrationOpen) {
    throw new HttpError(403, 'Les inscriptions sont fermées');
  }

  const address = invitation ? invitation.email : email;
  if (await usersRepository.findByEmail(address)) {
    throw new HttpError(409, 'Cette adresse est déjà utilisée');
  }

  const user = await createAccount({ email: address, password, firstName, lastName, invitation });
  const sessionToken = await createSession(user.id);
  return { user: toPublicUser(user), token: sessionToken };
}

// Répond toujours pareil, que l'adresse ait un compte ou non (on ne révèle pas qui est inscrit).
// Un échec d'envoi est seulement noté dans le journal du serveur, pour la même raison.
export async function forgotPassword({ email }) {
  const user = await usersRepository.findByEmail(email);
  if (!user) return;

  const { token, tokenHash } = generateToken();
  await resetTokensRepository.removeAllOfUser(user.id);
  await resetTokensRepository.create({
    userId: user.id,
    tokenHash,
    expiresAt: new Date(Date.now() + RESET_VALID_MS),
  });
  try {
    await sendEmail({ to: user.email, ...passwordResetEmail(token) });
  } catch (error) {
    console.error(`Mot de passe oublié : e-mail non envoyé (${error.message})`);
  }
}

// Lien de réinitialisation encore utilisable (existe, pas utilisé, pas expiré), sinon 400.
// Même message quelle que soit la raison du refus.
async function findUsableReset(token) {
  const reset = await resetTokensRepository.findByTokenHash(hashToken(token));
  if (!reset || reset.usedAt || reset.expiresAt.getTime() <= Date.now()) {
    throw new HttpError(400, 'Lien invalide ou expiré');
  }
  return reset;
}

// Pour l'écran du lien : à qui il sert et jusqu'à quand. Le jeton donne déjà le droit de changer
// le mot de passe de ce compte, donc lui montrer l'adresse ne révèle rien de plus.
export async function getPasswordReset(token) {
  const reset = await findUsableReset(token);
  const user = await usersRepository.findById(reset.userId);
  if (!user) throw new HttpError(400, 'Lien invalide ou expiré');
  return { email: user.email, expiresAt: reset.expiresAt };
}

export async function resetPassword({ token, password }) {
  const reset = await findUsableReset(token);

  const passwordHash = await hashPassword(password);
  await inTransaction(async (transaction) => {
    await usersRepository.update(reset.userId, { passwordHash }, { transaction });
    await resetTokensRepository.markUsed(reset.id, { transaction });
    await resetTokensRepository.removeAllOfUser(reset.userId, { transaction });
    // Pas de connexion automatique : toutes les sessions sont fermées, la personne se reconnecte
    await sessionsRepository.removeAllOfUser(reset.userId, { transaction });
  });
}

export const logoutAll = endAllSessions;
