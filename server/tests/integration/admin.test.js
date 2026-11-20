import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import app from '../../src/app.js';
import { sentEmails } from '../../src/integrations/mailer.js';
import {
  AppSetting,
  Invitation,
  PasswordResetToken,
  Recipe,
  Tag,
  User,
} from '../../src/models/index.js';
import { hashToken } from '../../src/utils/tokens.js';
import {
  createAdmin,
  createInvitation,
  createUser,
  lastEmailToken,
  loginAgent,
  resetAll,
} from '../helpers.js';

beforeEach(resetAll);

async function adminAgent() {
  const admin = await createAdmin();
  return { admin, agent: await loginAgent(admin) };
}

describe('routes /api/admin : droits', () => {
  it('refusent sans session (401) et pour un simple compte (403)', async () => {
    expect((await request(app).get('/api/admin/users')).status).toBe(401);
    expect((await request(app).get('/api/admin/settings')).status).toBe(401);

    const agent = await loginAgent(await createUser());
    for (const [method, url] of [
      ['get', '/api/admin/users'],
      ['patch', '/api/admin/users/1'],
      ['post', '/api/admin/users/1/reset-link'],
      ['get', '/api/admin/invitations'],
      ['post', '/api/admin/invitations'],
      ['patch', '/api/admin/settings'],
      ['post', '/api/admin/tags'],
      ['get', '/api/admin/foods/corrections'],
    ]) {
      expect((await agent[method](url).send({})).status, `${method} ${url}`).toBe(403);
    }
  });
});

describe('GET /api/admin/users', () => {
  it('liste les comptes avec le nombre de recettes, sans donnée sensible', async () => {
    const { admin, agent } = await adminAgent();
    const user = await createUser({ email: 'zoe@example.fr', firstName: 'Zoé', lastName: 'Test' });
    await Recipe.create({ ownerId: user.id, kind: 'recipe', title: 'Tarte' });
    await Recipe.create({ ownerId: user.id, kind: 'idea', title: 'Idée' });

    const res = await agent.get('/api/admin/users');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ total: 2, page: 1, limit: 20 });
    expect(res.body.items.map((u) => [u.id, u.recipeCount])).toEqual([
      [admin.id, 0],
      [user.id, 1],
    ]);
    expect(res.body.items[0].passwordHash).toBeUndefined();
  });

  it('trie par nom puis par prénom, et cherche aussi sur le nom', async () => {
    const { agent } = await adminAgent();
    await createUser({ email: 'b@example.fr', firstName: 'Bruno', lastName: 'Abel' });
    await createUser({ email: 'a@example.fr', firstName: 'Anna', lastName: 'Abel' });
    await createUser({ email: 'c@example.fr', firstName: 'Zoé', lastName: 'Zola' });
    const res = await agent.get('/api/admin/users');
    expect(res.body.items.map((u) => `${u.firstName} ${u.lastName}`)).toEqual([
      'Anna Abel',
      'Bruno Abel',
      'Admin Test',
      'Zoé Zola',
    ]);
    expect((await agent.get('/api/admin/users?q=zola')).body.total).toBe(1);
    expect((await agent.get('/api/admin/users?q=anna abel')).body.total).toBe(1);
  });

  it('cherche sur le nom ou l’e-mail sans tenir compte des accents', async () => {
    const { agent } = await adminAgent();
    await createUser({ email: 'zoe@example.fr', firstName: 'Zoé', lastName: 'Test' });
    expect((await agent.get('/api/admin/users?q=zoe')).body.total).toBe(1);
    expect((await agent.get('/api/admin/users?q=ZOÉ')).body.total).toBe(1);
    expect((await agent.get('/api/admin/users?q=admin@')).body.total).toBe(1);
    expect((await agent.get('/api/admin/users?q=inconnu')).body.total).toBe(0);
  });

  it('pagine et refuse une page invalide (400)', async () => {
    const { agent } = await adminAgent();
    await createUser({ email: 'a@example.fr', firstName: 'Anna', lastName: 'Test' });
    const res = await agent.get('/api/admin/users?limit=1&page=2');
    expect(res.body.items).toHaveLength(1);
    expect(res.body.total).toBe(2);
    expect((await agent.get('/api/admin/users?page=0')).status).toBe(400);
    expect((await agent.get('/api/admin/users?limit=500')).status).toBe(400);
  });
});

describe('PATCH /api/admin/users/:id', () => {
  it('change le rôle', async () => {
    const { agent } = await adminAgent();
    const user = await createUser();
    const res = await agent.patch(`/api/admin/users/${user.id}`).send({ role: 'admin' });
    expect(res.status).toBe(200);
    expect(res.body.role).toBe('admin');
    expect(res.body.passwordHash).toBeUndefined();
  });

  it('garde toujours un admin (409), mais autorise de se retirer s’il y en a un autre', async () => {
    const { admin, agent } = await adminAgent();
    const res = await agent.patch(`/api/admin/users/${admin.id}`).send({ role: 'user' });
    expect(res.status).toBe(409);
    expect((await User.findByPk(admin.id)).role).toBe('admin');

    await createUser({ role: 'admin' });
    const ok = await agent.patch(`/api/admin/users/${admin.id}`).send({ role: 'user' });
    expect(ok.status).toBe(200);
  });

  it('refuse un rôle inconnu (400) et un compte introuvable (404)', async () => {
    const { agent } = await adminAgent();
    const user = await createUser();
    expect((await agent.patch(`/api/admin/users/${user.id}`).send({ role: 'roi' })).status).toBe(
      400,
    );
    expect((await agent.patch('/api/admin/users/999').send({ role: 'user' })).status).toBe(404);
    expect((await agent.patch('/api/admin/users/abc').send({ role: 'user' })).status).toBe(400);
  });
});

describe('DELETE /api/admin/users/:id', () => {
  it('supprime le compte et ce qu’il possède', async () => {
    const { agent } = await adminAgent();
    const user = await createUser();
    await Recipe.create({ ownerId: user.id, kind: 'recipe', title: 'Tarte' });
    expect((await agent.delete(`/api/admin/users/${user.id}`)).status).toBe(204);
    expect(await User.findByPk(user.id)).toBeNull();
    expect(await Recipe.count()).toBe(0);
  });

  it('refuse de supprimer son propre compte (400) et un compte introuvable (404)', async () => {
    const { admin, agent } = await adminAgent();
    expect((await agent.delete(`/api/admin/users/${admin.id}`)).status).toBe(400);
    expect((await agent.delete('/api/admin/users/999')).status).toBe(404);
  });
});

describe('POST /api/admin/users/:id/reset-link', () => {
  it('envoie un lien de 24 h à la personne, sans le montrer à l’admin', async () => {
    const { admin, agent } = await adminAgent();
    const user = await createUser({ email: 'zoe@example.fr' });
    const res = await agent.post(`/api/admin/users/${user.id}/reset-link`);
    expect(res.status).toBe(204);
    expect(res.text).toBe('');

    expect(sentEmails.at(-1).to).toBe('zoe@example.fr');
    expect(sentEmails.at(-1).text).toContain('24 heures');
    const reset = await PasswordResetToken.findOne({
      where: { tokenHash: hashToken(lastEmailToken()) },
    });
    expect(reset.userId).toBe(user.id);
    expect(reset.createdById).toBe(admin.id);
    const hours = (reset.expiresAt.getTime() - Date.now()) / 3_600_000;
    expect(hours).toBeGreaterThan(23.9);
    expect(hours).toBeLessThanOrEqual(24);
  });

  it('le lien reçu permet de choisir un nouveau mot de passe', async () => {
    const { agent } = await adminAgent();
    const user = await createUser({ email: 'zoe@example.fr' });
    await agent.post(`/api/admin/users/${user.id}/reset-link`).expect(204);
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: lastEmailToken(), password: 'Nouveau1!' });
    expect(res.status).toBe(204);
  });

  it('renvoie 404 pour un compte introuvable', async () => {
    const { agent } = await adminAgent();
    expect((await agent.post('/api/admin/users/999/reset-link')).status).toBe(404);
  });
});

describe('invitations', () => {
  it('crée une invitation, envoie l’e-mail (7 jours) et la liste', async () => {
    const { admin, agent } = await adminAgent();
    const res = await agent.post('/api/admin/invitations').send({ email: ' Ami@Example.fr ' });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      email: 'ami@example.fr',
      invitedBy: { id: admin.id, firstName: 'Admin', lastName: 'Test' },
    });
    expect(res.body.tokenHash).toBeUndefined();
    const days = (new Date(res.body.expiresAt).getTime() - Date.now()) / 86_400_000;
    expect(days).toBeGreaterThan(6.9);

    expect(sentEmails.at(-1).to).toBe('ami@example.fr');
    expect(lastEmailToken()).toBeTruthy();

    const list = await agent.get('/api/admin/invitations');
    expect(list.body.map((i) => i.email)).toEqual(['ami@example.fr']);
  });

  it('le lien reçu permet de s’inscrire', async () => {
    const { agent } = await adminAgent();
    await agent.post('/api/admin/invitations').send({ email: 'ami@example.fr' });
    const res = await request(app).post('/api/auth/register').send({
      token: lastEmailToken(),
      password: 'Motdepasse1!',
      firstName: 'Ami',
      lastName: 'Test',
    });
    expect(res.status).toBe(201);
  });

  it('renouvelle une invitation en attente au lieu d’en créer une deuxième', async () => {
    const { agent } = await adminAgent();
    const first = await agent.post('/api/admin/invitations').send({ email: 'ami@example.fr' });
    const oldToken = lastEmailToken();
    const second = await agent.post('/api/admin/invitations').send({ email: 'ami@example.fr' });
    expect(second.status).toBe(201);
    expect(second.body.id).toBe(first.body.id);
    expect(await Invitation.count()).toBe(1);
    expect(lastEmailToken()).not.toBe(oldToken);
    // l'ancien lien ne marche plus
    const res = await request(app).get(`/api/auth/invitations/${oldToken}`);
    expect(res.status).toBe(404);
  });

  it('renouvelle aussi une invitation expirée', async () => {
    const { agent } = await adminAgent();
    await createInvitation({ email: 'ami@example.fr', expiresInMs: -1000 });
    expect((await agent.get('/api/admin/invitations')).body).toEqual([]);
    const res = await agent.post('/api/admin/invitations').send({ email: 'ami@example.fr' });
    expect(res.status).toBe(201);
    expect(await Invitation.count()).toBe(1);
    expect((await agent.get('/api/admin/invitations')).body).toHaveLength(1);
  });

  it('refuse une adresse qui a déjà un compte (409) ou invalide (400)', async () => {
    const { agent } = await adminAgent();
    await createUser({ email: 'zoe@example.fr' });
    expect(
      (await agent.post('/api/admin/invitations').send({ email: 'zoe@example.fr' })).status,
    ).toBe(409);
    const bad = await agent.post('/api/admin/invitations').send({ email: 'pas-un-mail' });
    expect(bad.status).toBe(400);
    expect(bad.body.error.details[0].message).toBe('Adresse e-mail invalide');
    expect(await Invitation.count()).toBe(0);
  });

  it('n’affiche pas les invitations déjà acceptées', async () => {
    const { agent } = await adminAgent();
    const { invitation } = await createInvitation();
    await invitation.update({ acceptedAt: new Date() });
    expect((await agent.get('/api/admin/invitations')).body).toEqual([]);
    expect((await agent.delete(`/api/admin/invitations/${invitation.id}`)).status).toBe(404);
  });

  it('annule une invitation (204), puis 404', async () => {
    const { agent } = await adminAgent();
    const { invitation, token } = await createInvitation();
    expect((await agent.delete(`/api/admin/invitations/${invitation.id}`)).status).toBe(204);
    expect((await agent.delete(`/api/admin/invitations/${invitation.id}`)).status).toBe(404);
    expect((await request(app).get(`/api/auth/invitations/${token}`)).status).toBe(404);
  });
});

describe('réglages', () => {
  it('lit puis change l’ouverture des inscriptions', async () => {
    const { agent } = await adminAgent();
    expect((await agent.get('/api/admin/settings')).body).toEqual({ registrationOpen: false });
    const res = await agent.patch('/api/admin/settings').send({ registrationOpen: true });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ registrationOpen: true });
    expect((await request(app).get('/api/settings/public')).body.registrationOpen).toBe(true);
    await agent.patch('/api/admin/settings').send({ registrationOpen: false });
    expect(await AppSetting.count()).toBe(1);
    expect((await request(app).get('/api/settings/public')).body.registrationOpen).toBe(false);
  });

  it('refuse une valeur invalide (400)', async () => {
    const { agent } = await adminAgent();
    expect(
      (await agent.patch('/api/admin/settings').send({ registrationOpen: 'oui' })).status,
    ).toBe(400);
    expect((await agent.patch('/api/admin/settings').send({})).status).toBe(400);
  });
});

describe('étiquettes', () => {
  it('GET /api/tags : liste triée, ouverte aux comptes connectés seulement', async () => {
    expect((await request(app).get('/api/tags')).status).toBe(401);
    await Tag.create({ name: 'Dessert', position: 1 });
    await Tag.create({ name: 'Plat', position: 0 });
    const agent = await loginAgent(await createUser());
    const res = await agent.get('/api/tags');
    expect(res.status).toBe(200);
    expect(res.body.map((t) => t.name)).toEqual(['Plat', 'Dessert']);
    expect(Object.keys(res.body[0]).sort()).toEqual(['id', 'name', 'position']);
  });

  it('crée à la suite, refuse un doublon (409, sans tenir compte de la casse) et un nom vide (400)', async () => {
    const { agent } = await adminAgent();
    const a = await agent.post('/api/admin/tags').send({ name: ' Plat ' });
    const b = await agent.post('/api/admin/tags').send({ name: 'Dessert' });
    expect(a.status).toBe(201);
    expect([a.body.name, a.body.position, b.body.position]).toEqual(['Plat', 0, 1]);
    expect((await agent.post('/api/admin/tags').send({ name: 'plat' })).status).toBe(409);
    expect((await agent.post('/api/admin/tags').send({ name: '  ' })).status).toBe(400);
    expect((await agent.post('/api/admin/tags').send({ name: 'x'.repeat(51) })).status).toBe(400);
  });

  it('renomme, et refuse un nom déjà pris (409) ou une étiquette introuvable (404)', async () => {
    const { agent } = await adminAgent();
    const a = (await agent.post('/api/admin/tags').send({ name: 'Plat' })).body;
    await agent.post('/api/admin/tags').send({ name: 'Dessert' });
    const ok = await agent.patch(`/api/admin/tags/${a.id}`).send({ name: 'Plat principal' });
    expect(ok.body.name).toBe('Plat principal');
    expect((await agent.patch(`/api/admin/tags/${a.id}`).send({ name: 'dessert' })).status).toBe(
      409,
    );
    expect(
      (await agent.patch(`/api/admin/tags/${a.id}`).send({ name: 'Plat principal' })).status,
    ).toBe(200);
    expect((await agent.patch('/api/admin/tags/999').send({ name: 'X' })).status).toBe(404);
    expect((await agent.patch(`/api/admin/tags/${a.id}`).send({})).status).toBe(400);
  });

  it('change l’ordre : la liste est renumérotée sans trou', async () => {
    const { agent } = await adminAgent();
    const ids = [];
    for (const name of ['A', 'B', 'C', 'D']) {
      ids.push((await agent.post('/api/admin/tags').send({ name })).body.id);
    }
    await agent.patch(`/api/admin/tags/${ids[3]}`).send({ position: 0 }).expect(200);
    let list = (await agent.get('/api/tags')).body;
    expect(list.map((t) => [t.name, t.position])).toEqual([
      ['D', 0],
      ['A', 1],
      ['B', 2],
      ['C', 3],
    ]);

    await agent.patch(`/api/admin/tags/${ids[3]}`).send({ position: 99 }).expect(200);
    list = (await agent.get('/api/tags')).body;
    expect(list.map((t) => t.name)).toEqual(['A', 'B', 'C', 'D']);
    expect(list.map((t) => t.position)).toEqual([0, 1, 2, 3]);
  });

  it('supprime (204) puis 404', async () => {
    const { agent } = await adminAgent();
    const tag = (await agent.post('/api/admin/tags').send({ name: 'Plat' })).body;
    expect((await agent.delete(`/api/admin/tags/${tag.id}`)).status).toBe(204);
    expect((await agent.delete(`/api/admin/tags/${tag.id}`)).status).toBe(404);
  });
});

describe('GET /api/users/search', () => {
  it('cherche par nom, sans soi-même, sans e-mail', async () => {
    const me = await createUser({ email: 'moi@example.fr', firstName: 'Marie', lastName: 'Test' });
    await createUser({ email: 'a@example.fr', firstName: 'Marion', lastName: 'Test' });
    await createUser({ email: 'b@example.fr', firstName: 'Éloïse', lastName: 'Test' });
    const agent = await loginAgent(me);

    const res = await agent.get('/api/users/search?q=mar');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: expect.any(Number), firstName: 'Marion', lastName: 'Test' }]);
    expect((await agent.get('/api/users/search?q=eloise')).body).toHaveLength(1);
  });

  it('trouve par « prénom nom » tapés ensemble, dans un ordre ou l’autre', async () => {
    const me = await createUser({ email: 'moi@example.fr' });
    await createUser({ email: 'c@example.fr', firstName: 'Camille', lastName: 'Du Pré' });
    await createUser({ email: 'd@example.fr', firstName: 'Camille', lastName: 'Martin' });
    const agent = await loginAgent(me);

    const full = await agent.get('/api/users/search?q=camille du pre');
    expect(full.body).toEqual([
      { id: expect.any(Number), firstName: 'Camille', lastName: 'Du Pré' },
    ]);
    expect((await agent.get('/api/users/search?q=du pre camille')).body).toHaveLength(1);
    expect((await agent.get('/api/users/search?q=camille')).body.map((u) => u.lastName)).toEqual([
      'Du Pré',
      'Martin',
    ]);
  });

  it('limite à 10 résultats', async () => {
    const agent = await loginAgent(await createUser());
    for (let i = 0; i < 12; i++) {
      await createUser({ email: `p${i}@example.fr`, firstName: `Pierre ${i}`, lastName: 'Test' });
    }
    expect((await agent.get('/api/users/search?q=pierre')).body).toHaveLength(10);
  });

  it('demande 2 lettres au moins (400) et une session (401)', async () => {
    const agent = await loginAgent(await createUser());
    const res = await agent.get('/api/users/search?q=a');
    expect(res.status).toBe(400);
    expect(res.body.error.details[0].message).toBe('Saisis au moins 2 lettres');
    expect((await agent.get('/api/users/search')).status).toBe(400);
    expect((await request(app).get('/api/users/search?q=ab')).status).toBe(401);
  });
});
