import { sendEmail } from '../integrations/mailer.js';
import * as resetTokensRepository from '../repositories/password-reset-tokens.repository.js';
import * as usersRepository from '../repositories/users.repository.js';
import { HttpError } from '../utils/HttpError.js';
import { offsetOf, paginated } from '../utils/pagination.js';
import { generateToken } from '../utils/tokens.js';
import { deletingPhotosOf } from './recipes.service.js';
import { toPublicUser } from './auth.service.js';
import { passwordResetEmail } from './emails.js';

const ADMIN_RESET_VALID_MS = 24 * 60 * 60 * 1000; // lien envoyé par l'admin : 24 heures

async function findOrFail(id) {
  const user = await usersRepository.findById(id);
  if (!user) throw new HttpError(404, 'Compte introuvable');
  return user;
}

export async function list(query) {
  const { rows, total } = await usersRepository.list({
    q: query.q,
    offset: offsetOf(query),
    limit: query.limit,
  });
  const counts = await usersRepository.recipeCounts(rows.map((user) => user.id));
  const items = rows.map((user) => ({ ...toPublicUser(user), recipeCount: counts[user.id] ?? 0 }));
  return paginated(items, total, query);
}

// Garde-fou : il reste toujours au moins un admin (on ne peut pas retirer ce rôle au dernier)
export async function setRole(id, role) {
  const user = await findOrFail(id);
  if (
    user.role === 'admin' &&
    role !== 'admin' &&
    (await usersRepository.countOtherAdmins(id)) === 0
  ) {
    throw new HttpError(409, 'Il doit rester au moins un administrateur');
  }
  return toPublicUser(await usersRepository.update(id, { role }));
}

// Tout ce que la personne possède part avec elle (cascades de la base)
export async function remove(adminId, id) {
  if (id === adminId) {
    throw new HttpError(400, 'Pour supprimer ton propre compte, utilise ton profil');
  }
  const user = await findOrFail(id);
  if (user.role === 'admin' && (await usersRepository.countOtherAdmins(id)) === 0) {
    throw new HttpError(409, 'Il doit rester au moins un administrateur');
  }
  await deletingPhotosOf(id, () => usersRepository.remove(id));
}

// Le lien part par e-mail à la personne : l'admin ne le voit jamais et ne connaît jamais le mot de passe.
export async function sendResetLink(adminId, id) {
  const user = await findOrFail(id);
  const { token, tokenHash } = generateToken();
  await resetTokensRepository.removeAllOfUser(user.id);
  await resetTokensRepository.create({
    userId: user.id,
    tokenHash,
    createdById: adminId,
    expiresAt: new Date(Date.now() + ADMIN_RESET_VALID_MS),
  });
  try {
    await sendEmail({ to: user.email, ...passwordResetEmail(token, { byAdmin: true }) });
  } catch (error) {
    // E-mail non parti : le lien ne servirait à personne
    await resetTokensRepository.removeAllOfUser(user.id);
    throw error;
  }
}
