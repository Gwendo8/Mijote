import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import app from '../../src/app.js';
import { MealSlot, Session, User } from '../../src/models/index.js';
import { createUser, loginAgent, PASSWORD, resetAll } from '../helpers.js';

beforeEach(resetAll);

describe('routes /api/me : protégées', () => {
  it('refusent sans session (401)', async () => {
    expect((await request(app).patch('/api/me').send({ displayName: 'X' })).status).toBe(401);
    expect((await request(app).put('/api/me/password').send({})).status).toBe(401);
    expect((await request(app).delete('/api/me').send({})).status).toBe(401);
  });
});

describe('PATCH /api/me', () => {
  it('change le nom affiché sans mot de passe', async () => {
    const agent = await loginAgent(await createUser());
    const res = await agent.patch('/api/me').send({ displayName: '  Gwendo  ' });
    expect(res.status).toBe(200);
    expect(res.body.displayName).toBe('Gwendo');
    expect(res.body.passwordHash).toBeUndefined();
  });

  it("change l'e-mail avec le mot de passe actuel", async () => {
    const agent = await loginAgent(await createUser());
    const res = await agent
      .patch('/api/me')
      .send({ email: 'Nouveau@Example.fr', currentPassword: PASSWORD });
    expect(res.status).toBe(200);
    expect(res.body.email).toBe('nouveau@example.fr');
  });

  it("demande le mot de passe actuel pour changer l'e-mail (400)", async () => {
    const agent = await loginAgent(await createUser());
    const res = await agent.patch('/api/me').send({ email: 'nouveau@example.fr' });
    expect(res.status).toBe(400);
    expect(res.body.error.details[0].path).toEqual(['currentPassword']);
  });

  it('refuse un mauvais mot de passe (401)', async () => {
    const agent = await loginAgent(await createUser());
    const res = await agent
      .patch('/api/me')
      .send({ email: 'nouveau@example.fr', currentPassword: 'Mauvais1!' });
    expect(res.status).toBe(401);
  });

  it('refuse une adresse déjà utilisée (409)', async () => {
    await createUser({ email: 'pris@example.fr' });
    const agent = await loginAgent(await createUser());
    const res = await agent
      .patch('/api/me')
      .send({ email: 'pris@example.fr', currentPassword: PASSWORD });
    expect(res.status).toBe(409);
  });

  it('refuse une demande vide ou invalide (400)', async () => {
    const agent = await loginAgent(await createUser());
    expect((await agent.patch('/api/me').send({})).status).toBe(400);
    expect((await agent.patch('/api/me').send({ displayName: '' })).status).toBe(400);
  });
});

describe('PUT /api/me/password', () => {
  it('change le mot de passe, ferme les autres appareils et garde celui en cours', async () => {
    const user = await createUser();
    const phone = await loginAgent(user);
    const pc = await loginAgent(user);

    const res = await phone
      .put('/api/me/password')
      .send({ currentPassword: PASSWORD, newPassword: 'Nouveau1234!' });
    expect(res.status).toBe(204);
    expect((await phone.get('/api/auth/me')).status).toBe(200);
    expect((await pc.get('/api/auth/me')).status).toBe(401);

    await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: PASSWORD })
      .expect(401);
    await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: 'Nouveau1234!' })
      .expect(200);
  });

  it('refuse un mauvais mot de passe actuel (401)', async () => {
    const agent = await loginAgent(await createUser());
    const res = await agent
      .put('/api/me/password')
      .send({ currentPassword: 'Mauvais1!', newPassword: 'Nouveau1234!' });
    expect(res.status).toBe(401);
  });

  it('refuse un nouveau mot de passe trop faible (400)', async () => {
    const agent = await loginAgent(await createUser());
    const res = await agent
      .put('/api/me/password')
      .send({ currentPassword: PASSWORD, newPassword: 'faible' });
    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/me', () => {
  it('supprime le compte et tout ce qu’il possède, sessions comprises', async () => {
    const user = await createUser();
    await MealSlot.create({ userId: user.id, name: 'Midi', position: 0, isDefault: true });
    const other = await createUser({ email: 'autre@example.fr' });
    const phone = await loginAgent(user);
    await loginAgent(user);
    const otherAgent = await loginAgent(other);

    const res = await phone.delete('/api/me').send({ password: PASSWORD });
    expect(res.status).toBe(204);
    expect(await User.findByPk(user.id)).toBeNull();
    expect(await MealSlot.count({ where: { userId: user.id } })).toBe(0);
    expect(await Session.count({ where: { userId: user.id } })).toBe(0);
    expect((await otherAgent.get('/api/auth/me')).status).toBe(200);
  });

  it('refuse un mauvais mot de passe (401) et ne supprime rien', async () => {
    const user = await createUser();
    const agent = await loginAgent(user);
    expect((await agent.delete('/api/me').send({ password: 'Mauvais1!' })).status).toBe(401);
    expect(await User.findByPk(user.id)).not.toBeNull();
  });

  it('refuse de supprimer la seule administratrice (409)', async () => {
    const admin = await createUser({ role: 'admin' });
    const agent = await loginAgent(admin);
    const res = await agent.delete('/api/me').send({ password: PASSWORD });
    expect(res.status).toBe(409);
    expect(await User.findByPk(admin.id)).not.toBeNull();
  });

  it('autorise une administratrice quand une autre existe', async () => {
    const admin = await createUser({ role: 'admin' });
    await createUser({ email: 'second@example.fr', role: 'admin' });
    const agent = await loginAgent(admin);
    expect((await agent.delete('/api/me').send({ password: PASSWORD })).status).toBe(204);
  });

  it('demande le mot de passe (400)', async () => {
    const agent = await loginAgent(await createUser());
    expect((await agent.delete('/api/me').send({})).status).toBe(400);
  });
});
