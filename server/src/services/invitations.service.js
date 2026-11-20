import { sendEmail } from '../integrations/mailer.js';
import * as invitationsRepository from '../repositories/invitations.repository.js';
import { inTransaction } from '../repositories/transactions.js';
import * as usersRepository from '../repositories/users.repository.js';
import { HttpError } from '../utils/HttpError.js';
import { generateToken } from '../utils/tokens.js';
import { invitationEmail } from './emails.js';

const INVITATION_VALID_MS = 7 * 24 * 60 * 60 * 1000; // 7 jours

// Jamais l'empreinte du jeton : seulement ce que l'écran admin affiche
const toInvitation = (invitation) => ({
  id: invitation.id,
  email: invitation.email,
  expiresAt: invitation.expiresAt,
  createdAt: invitation.createdAt,
  invitedBy: invitation.invitedBy
    ? { id: invitation.invitedBy.id, displayName: invitation.invitedBy.displayName }
    : null,
});

export async function list() {
  return (await invitationsRepository.listPending()).map(toInvitation);
}

// Invite une adresse. S'il existe déjà une invitation en attente pour elle, elle est renouvelée
// (nouveau lien, 7 jours de plus) au lieu d'être doublée. Si l'e-mail ne part pas, rien n'est gardé.
export async function invite(adminId, email) {
  if (await usersRepository.findByEmail(email)) {
    throw new HttpError(409, 'Cette personne a déjà un compte');
  }

  const { token, tokenHash } = generateToken();
  const expiresAt = new Date(Date.now() + INVITATION_VALID_MS);

  const id = await inTransaction(async (transaction) => {
    const pending = await invitationsRepository.findPendingByEmail(email, { transaction });
    let invitation;
    if (pending) {
      invitation = await pending.update(
        { tokenHash, expiresAt, invitedById: adminId },
        { transaction },
      );
      // `createdAt` ne change pas : on veut voir la date de la première invitation ; l'échéance dit le reste
    } else {
      invitation = await invitationsRepository.create(
        { email, tokenHash, expiresAt, invitedById: adminId },
        { transaction },
      );
    }
    await sendEmail({ to: email, ...invitationEmail(token) });
    return invitation.id;
  });

  return toInvitation(await invitationsRepository.findWithInviter(id));
}

export async function cancel(id) {
  if (!(await invitationsRepository.findPendingById(id))) {
    throw new HttpError(404, 'Invitation introuvable');
  }
  await invitationsRepository.remove(id);
}
