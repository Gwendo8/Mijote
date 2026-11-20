import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpError } from '../../src/utils/HttpError.js';
import { Invitation, PasswordResetToken } from '../../src/models/index.js';
import { createAdmin, createInvitation, createUser, loginAgent, resetAll } from '../helpers.js';

// E-mail impossible à envoyer (Brevo en panne) : on remplace l'envoi par une erreur 502
vi.mock('../../src/integrations/mailer.js', async (importOriginal) => ({
  ...(await importOriginal()),
  sendEmail: vi.fn(async () => {
    throw new HttpError(502, "L'e-mail n'a pas pu être envoyé, réessaie plus tard");
  }),
}));

beforeEach(resetAll);

describe('e-mail non envoyé (502)', () => {
  it('ne garde pas l’invitation créée', async () => {
    const agent = await loginAgent(await createAdmin());
    const res = await agent.post('/api/admin/invitations').send({ email: 'ami@example.fr' });
    expect(res.status).toBe(502);
    expect(await Invitation.count()).toBe(0);
  });

  it('laisse intacte l’invitation en attente qu’on essayait de renouveler', async () => {
    const agent = await loginAgent(await createAdmin());
    const { invitation, token } = await createInvitation({ email: 'ami@example.fr' });
    const before = invitation.tokenHash;
    expect(
      (await agent.post('/api/admin/invitations').send({ email: 'ami@example.fr' })).status,
    ).toBe(502);
    expect((await Invitation.findByPk(invitation.id)).tokenHash).toBe(before);
    expect(token).toBeTruthy();
  });

  it('ne garde pas le lien de réinitialisation', async () => {
    const agent = await loginAgent(await createAdmin());
    const user = await createUser({ email: 'zoe@example.fr' });
    expect((await agent.post(`/api/admin/users/${user.id}/reset-link`)).status).toBe(502);
    expect(await PasswordResetToken.count()).toBe(0);
  });
});
