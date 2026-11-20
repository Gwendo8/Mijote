import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import app from '../../src/app.js';
import { sentEmails } from '../../src/integrations/mailer.js';
import { AppSetting, Invitation, MealSlot, Session, User } from '../../src/models/index.js';
import { createAdminAccount } from '../../src/services/auth.service.js';
import {
  createInvitation,
  createUser,
  lastEmailToken,
  loginAgent,
  PASSWORD,
  resetAll,
} from '../helpers.js';

beforeEach(resetAll);

describe('GET /api/settings/public', () => {
  it("renvoie l'inscription fermée par défaut, puis ouverte selon le réglage", async () => {
    expect((await request(app).get('/api/settings/public')).body).toEqual({
      registrationOpen: false,
    });
    await AppSetting.create({ registrationOpen: true });
    expect((await request(app).get('/api/settings/public')).body).toEqual({
      registrationOpen: true,
    });
  });
});

describe('GET /api/auth/invitations/:token', () => {
  it("renvoie l'adresse de l'invitation", async () => {
    const { token } = await createInvitation();
    const res = await request(app).get(`/api/auth/invitations/${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ email: 'ami@example.fr' });
  });

  it('refuse un lien inconnu, expiré ou déjà utilisé (404)', async () => {
    expect((await request(app).get(`/api/auth/invitations/${'a'.repeat(43)}`)).status).toBe(404);
    const expired = await createInvitation({ expiresInMs: -1000 });
    expect((await request(app).get(`/api/auth/invitations/${expired.token}`)).status).toBe(404);
    const used = await createInvitation({ email: 'u@example.fr' });
    await used.invitation.update({ acceptedAt: new Date() });
    expect((await request(app).get(`/api/auth/invitations/${used.token}`)).status).toBe(404);
  });

  it('refuse un jeton mal formé (400)', async () => {
    expect((await request(app).get('/api/auth/invitations/court')).status).toBe(400);
  });
});

describe('POST /api/auth/register', () => {
  const body = { password: PASSWORD, displayName: 'Camille' };

  it("crée le compte avec une invitation : e-mail de l'invitation, 4 créneaux, connecté", async () => {
    const { token, invitation } = await createInvitation();
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...body, token, email: 'autre@example.fr' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      email: 'ami@example.fr',
      displayName: 'Camille',
      role: 'user',
    });
    expect(res.body.passwordHash).toBeUndefined();
    expect(res.headers['set-cookie'][0]).toMatch(/mijote_session=.*HttpOnly/);

    const slots = await MealSlot.findAll({
      where: { userId: res.body.id },
      order: [['position', 'ASC']],
    });
    expect(slots.map((s) => s.name)).toEqual(['Petit-déjeuner', 'Midi', 'Collation', 'Soir']);
    expect(slots.every((s) => s.isDefault && !s.isHidden)).toBe(true);
    expect((await invitation.reload()).acceptedAt).not.toBeNull();
  });

  it("l'invitation ne sert qu'une fois (404)", async () => {
    const { token } = await createInvitation();
    await request(app)
      .post('/api/auth/register')
      .send({ ...body, token })
      .expect(201);
    await request(app)
      .post('/api/auth/register')
      .send({ ...body, token })
      .expect(404);
  });

  it('refuse sans invitation quand les inscriptions sont fermées (403)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...body, email: 'libre@example.fr' });
    expect(res.status).toBe(403);
    expect(await User.count()).toBe(0);
  });

  it('accepte sans invitation quand les inscriptions sont ouvertes', async () => {
    await AppSetting.create({ registrationOpen: true });
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...body, email: 'Libre@Example.fr' });
    expect(res.status).toBe(201);
    expect(res.body.email).toBe('libre@example.fr');
  });

  it('refuse une adresse déjà utilisée (409)', async () => {
    await createUser({ email: 'ami@example.fr' });
    const { token } = await createInvitation();
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...body, token });
    expect(res.status).toBe(409);
    expect(res.body.error.message).toBe('Cette adresse est déjà utilisée');
  });

  it('renvoie un message par champ invalide (400)', async () => {
    await AppSetting.create({ registrationOpen: true });
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'pas-un-mail', password: 'court', displayName: '' });
    expect(res.status).toBe(400);
    const byPath = Object.fromEntries(res.body.error.details.map((d) => [d.path[0], d.message]));
    expect(byPath.email).toBe('Adresse e-mail invalide');
    expect(byPath.displayName).toBe('Le nom affiché est obligatoire');
    expect(byPath.password).toContain('au moins');
  });

  it("demande l'e-mail quand il n'y a pas d'invitation (400)", async () => {
    await AppSetting.create({ registrationOpen: true });
    const res = await request(app).post('/api/auth/register').send(body);
    expect(res.status).toBe(400);
    expect(res.body.error.details[0].path).toEqual(['email']);
  });
});

describe('connexion et session', () => {
  it('connecte avec le bon mot de passe et renvoie le compte sans donnée sensible', async () => {
    await createUser();
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'GWEN@example.fr', password: PASSWORD });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ email: 'gwen@example.fr', displayName: 'Gwen', role: 'user' });
    expect(res.body.passwordHash).toBeUndefined();
    expect(await Session.count()).toBe(1);
  });

  it('donne le même message pour une adresse inconnue et un mauvais mot de passe (401)', async () => {
    await createUser();
    const wrongPassword = await request(app)
      .post('/api/auth/login')
      .send({ email: 'gwen@example.fr', password: 'Mauvais1!' });
    const unknown = await request(app)
      .post('/api/auth/login')
      .send({ email: 'inconnu@example.fr', password: PASSWORD });
    expect(wrongPassword.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(unknown.body).toEqual(wrongPassword.body);
  });

  it('refuse une demande incomplète (400)', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'x' });
    expect(res.status).toBe(400);
  });

  it('bloque après 10 échecs (429)', async () => {
    await createUser();
    for (let i = 0; i < 10; i++) {
      await request(app)
        .post('/api/auth/login')
        .send({ email: 'gwen@example.fr', password: 'Mauvais1!' });
    }
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'gwen@example.fr', password: PASSWORD });
    expect(res.status).toBe(429);
  });

  it('GET /me : 401 sans session, le compte avec une session', async () => {
    expect((await request(app).get('/api/auth/me')).status).toBe(401);
    const agent = await loginAgent(await createUser());
    const res = await agent.get('/api/auth/me');
    expect(res.status).toBe(200);
    expect(res.body.email).toBe('gwen@example.fr');
  });

  it('refuse un cookie inconnu (401)', async () => {
    const res = await request(app).get('/api/auth/me').set('Cookie', 'mijote_session=nimportequoi');
    expect(res.status).toBe(401);
  });

  it('refuse une session expirée et la supprime (401)', async () => {
    const agent = await loginAgent(await createUser());
    await Session.update({ expiresAt: new Date(Date.now() - 1000) }, { where: {} });
    expect((await agent.get('/api/auth/me')).status).toBe(401);
    expect(await Session.count()).toBe(0);
  });

  it('prolonge la session de 6 mois à la première visite après un jour, pas avant', async () => {
    const user = await createUser();
    const agent = await loginAgent(user);

    const same = await agent.get('/api/auth/me');
    expect(same.headers['set-cookie']).toBeUndefined();

    const twoDaysAgo = new Date(Date.now() - 2 * 86_400_000);
    await Session.update(
      { lastUsedAt: twoDaysAgo, expiresAt: new Date(Date.now() + 1000) },
      { where: {} },
    );
    const renewed = await agent.get('/api/auth/me');
    expect(renewed.headers['set-cookie'][0]).toMatch(/mijote_session=/);
    const session = await Session.findOne();
    expect(session.expiresAt.getTime()).toBeGreaterThan(Date.now() + 170 * 86_400_000);
  });

  it("« Se déconnecter » ne ferme que l'appareil en cours", async () => {
    const user = await createUser();
    const phone = await loginAgent(user);
    const pc = await loginAgent(user);

    await phone.post('/api/auth/logout').expect(204);
    expect((await phone.get('/api/auth/me')).status).toBe(401);
    expect((await pc.get('/api/auth/me')).status).toBe(200);
    expect(await Session.count()).toBe(1);
  });

  it('« Me déconnecter partout » ferme tous les appareils du compte, pas ceux des autres', async () => {
    const user = await createUser();
    const other = await createUser({ email: 'autre@example.fr' });
    const phone = await loginAgent(user);
    const pc = await loginAgent(user);
    const otherAgent = await loginAgent(other);

    await phone.post('/api/auth/logout-all').expect(204);
    expect((await phone.get('/api/auth/me')).status).toBe(401);
    expect((await pc.get('/api/auth/me')).status).toBe(401);
    expect((await otherAgent.get('/api/auth/me')).status).toBe(200);
  });

  it('les routes de déconnexion demandent d’être connecté (401)', async () => {
    expect((await request(app).post('/api/auth/logout')).status).toBe(401);
    expect((await request(app).post('/api/auth/logout-all')).status).toBe(401);
  });
});

describe('mot de passe oublié', () => {
  it("répond 204 sans envoyer d'e-mail quand l'adresse est inconnue", async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'inconnu@example.fr' });
    expect(res.status).toBe(204);
    expect(sentEmails).toHaveLength(0);
  });

  it('envoie un lien par e-mail, qui permet de choisir un nouveau mot de passe', async () => {
    const user = await createUser();
    const agent = await loginAgent(user);

    const res = await request(app).post('/api/auth/forgot-password').send({ email: user.email });
    expect(res.status).toBe(204);
    expect(sentEmails).toHaveLength(1);
    expect(sentEmails[0].to).toBe(user.email);
    const token = lastEmailToken();
    expect(token).toBeTruthy();

    const reset = await request(app)
      .post('/api/auth/reset-password')
      .send({ token, password: 'Nouveau1234!' });
    expect(reset.status).toBe(204);
    // Pas de connexion automatique, et les anciennes sessions sont fermées
    expect(reset.headers['set-cookie']).toBeUndefined();
    expect((await agent.get('/api/auth/me')).status).toBe(401);

    await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: PASSWORD })
      .expect(401);
    await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: 'Nouveau1234!' })
      .expect(200);
  });

  it('le lien ne sert qu’une fois (400)', async () => {
    const user = await createUser();
    await request(app).post('/api/auth/forgot-password').send({ email: user.email });
    const token = lastEmailToken();
    await request(app)
      .post('/api/auth/reset-password')
      .send({ token, password: 'Nouveau1234!' })
      .expect(204);
    const again = await request(app)
      .post('/api/auth/reset-password')
      .send({ token, password: 'Autre12345!' });
    expect(again.status).toBe(400);
    expect(again.body.error.message).toBe('Lien invalide ou expiré');
  });

  it('un nouveau lien annule le précédent', async () => {
    const user = await createUser();
    await request(app).post('/api/auth/forgot-password').send({ email: user.email });
    const first = lastEmailToken();
    await request(app).post('/api/auth/forgot-password').send({ email: user.email });
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: first, password: 'Nouveau1234!' });
    expect(res.status).toBe(400);
  });

  it('refuse un lien expiré ou inconnu (400)', async () => {
    const user = await createUser();
    await request(app).post('/api/auth/forgot-password').send({ email: user.email });
    const token = lastEmailToken();
    await User.sequelize.query(
      "UPDATE password_reset_tokens SET expires_at = now() - interval '1 minute'",
    );
    expect(
      (
        await request(app)
          .post('/api/auth/reset-password')
          .send({ token, password: 'Nouveau1234!' })
      ).status,
    ).toBe(400);
    expect(
      (
        await request(app)
          .post('/api/auth/reset-password')
          .send({ token: 'a'.repeat(43), password: 'Nouveau1234!' })
      ).status,
    ).toBe(400);
  });

  it('refuse un nouveau mot de passe trop faible (400, un message par règle)', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: 'a'.repeat(43), password: 'abc' });
    expect(res.status).toBe(400);
    expect(res.body.error.details.length).toBeGreaterThanOrEqual(2);
  });

  it('limite les demandes à 5 par 15 minutes (429)', async () => {
    for (let i = 0; i < 5; i++) {
      await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'x@example.fr' })
        .expect(204);
    }
    expect(
      (await request(app).post('/api/auth/forgot-password').send({ email: 'x@example.fr' })).status,
    ).toBe(429);
  });

  it("n'échoue pas si l'e-mail ne part pas (même réponse, rien à deviner)", async () => {
    // Brevo configuré mais injoignable : fetch est remplacé par une erreur réseau
    const { env } = await import('../../src/config/env.js');
    const user = await createUser();
    const original = globalThis.fetch;
    globalThis.fetch = () => Promise.reject(new Error('réseau coupé'));
    Object.assign(env, { BREVO_API_KEY: 'cle', MAIL_FROM_EMAIL: 'noreply@example.fr' });
    try {
      const res = await request(app).post('/api/auth/forgot-password').send({ email: user.email });
      expect(res.status).toBe(204);
    } finally {
      globalThis.fetch = original;
      Object.assign(env, { BREVO_API_KEY: undefined, MAIL_FROM_EMAIL: undefined });
    }
  });
});

describe('createAdminAccount (script admin:create)', () => {
  it('crée un admin avec ses 4 créneaux, et refuse une adresse déjà prise', async () => {
    const admin = await createAdminAccount({
      email: 'admin@example.fr',
      password: PASSWORD,
      displayName: 'Admin',
    });
    expect(admin).toMatchObject({ email: 'admin@example.fr', role: 'admin' });
    expect(await MealSlot.count({ where: { userId: admin.id } })).toBe(4);
    await expect(
      createAdminAccount({ email: 'admin@example.fr', password: PASSWORD, displayName: 'Autre' }),
    ).rejects.toMatchObject({ status: 409 });
  });
});

describe('Invitation (modèle)', () => {
  it('ne garde pas le jeton en clair', async () => {
    const { token, invitation } = await createInvitation();
    expect(JSON.stringify(invitation.toJSON())).not.toContain(token);
    expect(await Invitation.count()).toBe(1);
  });
});
