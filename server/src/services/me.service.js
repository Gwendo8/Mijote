import * as usersRepository from '../repositories/users.repository.js';
import { inTransaction } from '../repositories/transactions.js';
import { HttpError } from '../utils/HttpError.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { toPublicUser } from './auth.service.js';
import { endOtherSessions } from './session.service.js';
import { UniqueConstraintError } from 'sequelize';

// Vérifie le mot de passe de la personne connectée, sinon 401.
async function requirePassword(userId, password) {
  const user = await usersRepository.findByIdWithPassword(userId);
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    throw new HttpError(401, 'Mot de passe incorrect');
  }
  return user;
}

export async function updateProfile(userId, { displayName, email, currentPassword }) {
  const changes = {};
  if (displayName !== undefined) changes.displayName = displayName;

  const current = await usersRepository.findById(userId);
  if (email !== undefined && email !== current.email) {
    if (!currentPassword) {
      throw new HttpError(400, 'Données invalides', [
        { path: ['currentPassword'], message: 'Saisis ton mot de passe actuel', code: 'custom' },
      ]);
    }
    await requirePassword(userId, currentPassword);
    changes.email = email;
  }

  try {
    return toPublicUser(await usersRepository.update(userId, changes));
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      throw new HttpError(409, 'Cette adresse est déjà utilisée');
    }
    throw error;
  }
}

// Les sessions des AUTRES appareils sont fermées ; l'appareil en cours reste connecté.
export async function changePassword(userId, sessionId, { currentPassword, newPassword }) {
  await requirePassword(userId, currentPassword);
  const passwordHash = await hashPassword(newPassword);
  await inTransaction(async (transaction) => {
    await usersRepository.update(userId, { passwordHash }, { transaction });
    await endOtherSessions(userId, sessionId, { transaction });
  });
}

// Tout ce que la personne possède part avec elle (cascades de la base), sessions comprises.
export async function deleteAccount(user, { password }) {
  await requirePassword(user.id, password);
  if (user.role === 'admin' && (await usersRepository.countOtherAdmins(user.id)) === 0) {
    throw new HttpError(
      409,
      'Tu es la seule administratrice : nomme quelqu’un d’autre avant de supprimer ton compte',
    );
  }
  await usersRepository.remove(user.id);
}
