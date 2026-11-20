import { access, readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import request from 'supertest';
import sharp from 'sharp';
import { beforeEach, describe, expect, it } from 'vitest';
import app from '../../src/app.js';
import { Recipe } from '../../src/models/index.js';
import {
  createAdmin,
  createRecipe,
  createUser,
  loginAgent,
  PASSWORD,
  resetAll,
} from '../helpers.js';

const uploadDir = () => path.join(process.env.UPLOAD_DIR, 'recipes');

beforeEach(async () => {
  await resetAll();
  await rm(uploadDir(), { recursive: true, force: true });
});
const filesOnDisk = async () => readdir(uploadDir()).catch(() => []);

// Images générées par le test : aucune vraie photo dans le dépôt
const png = (width, height) =>
  sharp({ create: { width, height, channels: 3, background: '#c0392b' } })
    .png()
    .toBuffer();

async function userAgent(overrides) {
  const user = await createUser(overrides);
  return { user, agent: await loginAgent(user) };
}

// Lit la réponse comme des octets bruts (une image)
const binary = (res, callback) => {
  const chunks = [];
  res.on('data', (chunk) => chunks.push(chunk));
  res.on('end', () => callback(null, Buffer.concat(chunks)));
};

const upload = (agent, id, buffer, filename = 'photo.png') =>
  agent.put(`/api/recipes/${id}/photo`).attach('photo', buffer, { filename });

describe('photos de recettes', () => {
  it('reçoit une photo, la réduit à 1200 px en WebP et la sert', async () => {
    const { user, agent } = await userAgent();
    const recipe = await createRecipe(user);

    const res = await upload(agent, recipe.id, await png(2400, 1600));
    expect(res.status).toBe(200);
    expect(res.body.photoUrl).toMatch(new RegExp(`^/api/recipes/${recipe.id}/photo\\?v=\\d+$`));

    const image = await agent.get(res.body.photoUrl).buffer(true).parse(binary);
    expect(image.status).toBe(200);
    expect(image.headers['content-type']).toBe('image/webp');
    expect(image.headers['cache-control']).toMatch(/private/);
    const meta = await sharp(image.body).metadata();
    expect(meta).toMatchObject({ format: 'webp', width: 1200, height: 800 });

    const detail = await agent.get(`/api/recipes/${recipe.id}`);
    expect(detail.body.photoUrl).toBe(res.body.photoUrl);
  });

  it('n’agrandit pas une petite image', async () => {
    const { user, agent } = await userAgent();
    const recipe = await createRecipe(user);
    const res = await upload(agent, recipe.id, await png(300, 200));
    const image = await agent.get(res.body.photoUrl).buffer(true).parse(binary);
    expect((await sharp(image.body).metadata()).width).toBe(300);
  });

  it('refuse un fichier qui n’est pas une image, ou l’absence de fichier (400)', async () => {
    const { user, agent } = await userAgent();
    const recipe = await createRecipe(user);
    const notImage = await upload(agent, recipe.id, Buffer.from('ceci est du texte'), 'a.png');
    expect(notImage.status).toBe(400);
    expect(notImage.body.error.message).toBe('Image invalide ou trop lourde');
    expect((await agent.put(`/api/recipes/${recipe.id}/photo`)).status).toBe(400);
    expect(await filesOnDisk()).toEqual([]);
  });

  it('remplacer la photo efface l’ancienne du disque, la supprimer aussi', async () => {
    const { user, agent } = await userAgent();
    const recipe = await createRecipe(user);
    await upload(agent, recipe.id, await png(100, 100));
    await upload(agent, recipe.id, await png(120, 120));
    expect(await filesOnDisk()).toHaveLength(1);

    expect((await agent.delete(`/api/recipes/${recipe.id}/photo`)).status).toBe(204);
    expect(await filesOnDisk()).toHaveLength(0);
    expect((await agent.get(`/api/recipes/${recipe.id}/photo`)).status).toBe(404); // plus de photo
    expect((await agent.delete(`/api/recipes/${recipe.id}/photo`)).status).toBe(204);
  });

  it('supprimer la recette efface sa photo', async () => {
    const { user, agent } = await userAgent();
    const recipe = await createRecipe(user);
    await upload(agent, recipe.id, await png(100, 100));
    await agent.delete(`/api/recipes/${recipe.id}`);
    expect(await filesOnDisk()).toHaveLength(0);
  });

  it('contrôle les droits : 404 si la recette est invisible, 403 pour modifier celle d’un autre', async () => {
    const { user: gwen, agent: gwenAgent } = await userAgent();
    const recipe = await createRecipe(gwen);
    const { agent } = await userAgent({
      email: 'camille@example.fr',
      firstName: 'Camille',
      lastName: 'Durand',
    });
    const picture = await png(100, 100);

    await upload(gwenAgent, recipe.id, picture);
    expect((await agent.get(`/api/recipes/${recipe.id}/photo`)).status).toBe(404);
    expect((await upload(agent, recipe.id, picture)).status).toBe(404);

    await Recipe.update({ visibility: 'public' }, { where: { id: recipe.id } });
    expect((await agent.get(`/api/recipes/${recipe.id}/photo`)).status).toBe(200);
    expect((await upload(agent, recipe.id, picture)).status).toBe(403);
    expect((await agent.delete(`/api/recipes/${recipe.id}/photo`)).status).toBe(403);
    expect((await request(app).get(`/api/recipes/${recipe.id}/photo`)).status).toBe(401);
  });

  it('copier la recette copie aussi la photo (fichier à part)', async () => {
    const { user, agent } = await userAgent();
    const recipe = await createRecipe(user);
    await upload(agent, recipe.id, await png(100, 100));
    const copy = await agent.post(`/api/recipes/${recipe.id}/copy`);
    expect(copy.body.photoUrl).toBeTruthy();
    expect(await filesOnDisk()).toHaveLength(2);

    await agent.delete(`/api/recipes/${recipe.id}`);
    expect(await filesOnDisk()).toHaveLength(1);
    expect((await agent.get(copy.body.photoUrl)).status).toBe(200);
  });
});

describe('suppression d’un compte : photos des recettes', () => {
  it('par la personne : efface ses photos du disque', async () => {
    const { user, agent } = await userAgent();
    const recipe = await createRecipe(user);
    await upload(agent, recipe.id, await png(100, 100));
    const files = await filesOnDisk();
    expect(files).toHaveLength(1);

    expect((await agent.delete('/api/me').send({ password: PASSWORD })).status).toBe(204);
    expect(await filesOnDisk()).toHaveLength(0);
    await expect(access(path.join(uploadDir(), files[0]))).rejects.toThrow();
  });

  it('par l’admin : efface les photos du compte supprimé, pas celles des autres', async () => {
    const admin = await createAdmin();
    const adminAgent = await loginAgent(admin);
    const { user, agent } = await userAgent();
    const { user: other, agent: otherAgent } = await userAgent({
      email: 'camille@example.fr',
      firstName: 'Camille',
      lastName: 'Durand',
    });
    await upload(agent, (await createRecipe(user)).id, await png(100, 100));
    await upload(otherAgent, (await createRecipe(other)).id, await png(100, 100));
    expect(await filesOnDisk()).toHaveLength(2);

    expect((await adminAgent.delete(`/api/admin/users/${user.id}`)).status).toBe(204);
    expect(await filesOnDisk()).toHaveLength(1);
  });
});
