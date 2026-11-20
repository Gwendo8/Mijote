import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import app from '../../src/app.js';
import { resetRateLimits } from '../../src/middlewares/rateLimits.js';
import {
  Food,
  FoodCorrection,
  Recipe,
  RecipeIngredient,
  RecipeShare,
} from '../../src/models/index.js';
import { createAdmin, createFood, createUser, loginAgent, resetAll } from '../helpers.js';

beforeEach(resetAll);
afterEach(() => vi.unstubAllGlobals());

const perso = { name: 'Granola maison', energyKcal: 420, proteinsG: 9, carbsG: 60, fatsG: 15 };

async function userAgent(overrides) {
  const user = await createUser(overrides);
  return { user, agent: await loginAgent(user) };
}

describe('routes /api/foods : droits', () => {
  it('refusent sans session (401)', async () => {
    expect((await request(app).get('/api/foods?q=poulet')).status).toBe(401);
    expect((await request(app).get('/api/foods/mine')).status).toBe(401);
    expect((await request(app).get('/api/foods/1')).status).toBe(401);
    expect((await request(app).get('/api/foods/barcode/3017620422003')).status).toBe(401);
    expect((await request(app).get('/api/foods/off/search?q=nutella')).status).toBe(401);
    expect((await request(app).post('/api/foods').send(perso)).status).toBe(401);
    expect((await request(app).patch('/api/foods/1').send({ name: 'x' })).status).toBe(401);
    expect((await request(app).delete('/api/foods/1')).status).toBe(401);
  });
});

describe('GET /api/foods (recherche)', () => {
  it('trouve sans tenir compte des accents ni des majuscules, tous les mots devant y être', async () => {
    const { agent } = await userAgent();
    await createFood({ name: 'Crème fraîche épaisse' });
    await createFood({ name: 'Crème de soja' });

    const res = await agent.get('/api/foods?q=CREME fraiche');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ total: 1, page: 1, limit: 20 });
    expect(res.body.items[0]).toMatchObject({ name: 'Crème fraîche épaisse', source: 'ciqual' });
    expect((await agent.get('/api/foods?q=creme')).body.total).toBe(2);
    expect((await agent.get('/api/foods?q=introuvable')).body.total).toBe(0);
  });

  it('renvoie des nombres arrondis à 1 décimale et le format de l’aliment', async () => {
    const { agent } = await userAgent();
    await createFood({
      name: 'Poulet',
      energyKcal: 151.25,
      proteinsG: 29.84,
      carbsG: 0,
      fatsG: null,
    });
    const food = (await agent.get('/api/foods?q=poulet')).body.items[0];
    expect(food).toMatchObject({
      energyKcal: 151.3,
      proteinsG: 29.8,
      carbsG: 0,
      fatsG: null,
      isCorrected: false,
      isMine: false,
    });
    expect(food.original).toBeUndefined();
  });

  it('exclut les aliments archivés et les aliments perso des autres', async () => {
    const { user, agent } = await userAgent();
    const other = await createUser({
      email: 'autre@example.fr',
      firstName: 'Autre',
      lastName: 'Test',
    });
    await createFood({ name: 'Riz ancien', archivedAt: new Date() });
    await createFood({ name: 'Riz perso à moi', source: 'user', ownerId: user.id });
    await createFood({ name: 'Riz perso de l’autre', source: 'user', ownerId: other.id });
    await createFood({
      name: 'Riz perso archivé',
      source: 'user',
      ownerId: user.id,
      archivedAt: new Date(),
    });
    await createFood({ name: 'Riz basmati' });
    await createFood({ name: 'Riz du produit', source: 'off', barcode: '3017620422003' });

    const names = (await agent.get('/api/foods?q=riz')).body.items.map((f) => f.name);
    expect(names.sort()).toEqual(['Riz basmati', 'Riz du produit', 'Riz perso à moi']);
  });

  it('filtre par source', async () => {
    const { user, agent } = await userAgent();
    await createFood({ name: 'Pain Ciqual' });
    await createFood({ name: 'Pain perso', source: 'user', ownerId: user.id });
    await createFood({ name: 'Pain off', source: 'off', barcode: '12345678' });
    for (const [source, name] of [
      ['ciqual', 'Pain Ciqual'],
      ['user', 'Pain perso'],
      ['off', 'Pain off'],
    ]) {
      const items = (await agent.get(`/api/foods?q=pain&source=${source}`)).body.items;
      expect(items.map((f) => f.name)).toEqual([name]);
    }
    expect((await agent.get('/api/foods?q=pain&source=autre')).status).toBe(400);
  });

  it('classe : nom qui commence par la recherche, puis Ciqual avant Open Food Facts, puis nom court', async () => {
    const { agent } = await userAgent();
    await createFood({ name: 'Sauce tomate' });
    await createFood({ name: 'Tomate farcie au riz' });
    await createFood({ name: 'Tomate', source: 'off', barcode: '11111111' });
    await createFood({ name: 'Tomate cerise' });
    const names = (await agent.get('/api/foods?q=tomate')).body.items.map((f) => f.name);
    expect(names).toEqual(['Tomate cerise', 'Tomate farcie au riz', 'Tomate', 'Sauce tomate']);
  });

  it('cherche aussi dans le nom corrigé et la marque', async () => {
    const { agent } = await userAgent();
    const food = await createFood({ name: 'Pâte à tartiner', brand: 'Nutella' });
    await FoodCorrection.create({ foodId: food.id, name: 'Pâte noisette' });
    expect((await agent.get('/api/foods?q=nutella')).body.total).toBe(1);
    expect((await agent.get('/api/foods?q=noisette')).body.total).toBe(1);
  });

  it('prend les caractères spéciaux au pied de la lettre', async () => {
    const { agent } = await userAgent();
    await createFood({ name: 'Pain 100% céréales' });
    await createFood({ name: 'Pain complet' });
    expect((await agent.get('/api/foods?q=100%25')).body.total).toBe(1);
    expect((await agent.get('/api/foods?q=pa_n')).body.total).toBe(0);
  });

  it('demande 2 caractères au moins (400) et pagine', async () => {
    const { agent } = await userAgent();
    const res = await agent.get('/api/foods?q=p');
    expect(res.status).toBe(400);
    expect(res.body.error.details[0].message).toBe('Saisis au moins 2 caractères');
    expect((await agent.get('/api/foods')).status).toBe(400);

    await createFood({ name: 'Pomme' });
    await createFood({ name: 'Pomme de terre' });
    const page = await agent.get('/api/foods?q=pomme&limit=1&page=2');
    expect(page.body).toMatchObject({ total: 2, page: 2, limit: 1 });
    expect(page.body.items.map((f) => f.name)).toEqual(['Pomme de terre']);
  });
});

describe('valeurs corrigées', () => {
  it('renvoie la valeur corrigée, avec l’original et la note', async () => {
    const { agent } = await userAgent();
    const food = await createFood();
    await FoodCorrection.create({
      foodId: food.id,
      energyKcal: 140,
      note: 'Vérifié sur l’emballage',
    });

    const res = await agent.get(`/api/foods/${food.id}`);
    expect(res.body).toMatchObject({
      energyKcal: 140,
      proteinsG: 29.8,
      isCorrected: true,
      original: { name: 'Poulet, blanc, cuit', energyKcal: 151, proteinsG: 29.8 },
      correctionNote: 'Vérifié sur l’emballage',
    });
    expect((await agent.get('/api/foods?q=poulet')).body.items[0].energyKcal).toBe(140);
  });
});

describe('GET /api/foods/:id', () => {
  it('lit un aliment, même archivé, et refuse un identifiant invalide (400) ou inconnu (404)', async () => {
    const { agent } = await userAgent();
    const food = await createFood({ archivedAt: new Date() });
    expect((await agent.get(`/api/foods/${food.id}`)).body.id).toBe(food.id);
    expect((await agent.get('/api/foods/999')).status).toBe(404);
    expect((await agent.get('/api/foods/abc')).status).toBe(400);
  });

  it('cache l’aliment perso d’une autre personne, sauf si une recette que je vois l’utilise', async () => {
    const { user, agent } = await userAgent();
    const owner = await createUser({
      email: 'autre@example.fr',
      firstName: 'Autre',
      lastName: 'Test',
    });
    const food = await createFood({ name: 'Secret', source: 'user', ownerId: owner.id });
    expect((await agent.get(`/api/foods/${food.id}`)).status).toBe(404);

    const recipe = await Recipe.create({ ownerId: owner.id, kind: 'recipe', title: 'Privée' });
    await RecipeIngredient.create({
      recipeId: recipe.id,
      label: 'ingrédient',
      foodId: food.id,
      grams: 100,
      position: 0,
    });
    expect((await agent.get(`/api/foods/${food.id}`)).status).toBe(404);

    await recipe.update({ visibility: 'shared' });
    expect((await agent.get(`/api/foods/${food.id}`)).status).toBe(404);
    await RecipeShare.create({ recipeId: recipe.id, userId: user.id });
    expect((await agent.get(`/api/foods/${food.id}`)).status).toBe(200);

    await RecipeShare.destroy({ where: { recipeId: recipe.id } });
    await recipe.update({ visibility: 'public' });
    expect((await agent.get(`/api/foods/${food.id}`)).status).toBe(200);
  });
});

describe('aliments perso', () => {
  it('crée (201), à moi, et le retrouve dans la liste et la recherche', async () => {
    const { user, agent } = await userAgent();
    const res = await agent.post('/api/foods').send({ ...perso, brand: ' Maison ', category: '' });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      source: 'user',
      name: 'Granola maison',
      brand: 'Maison',
      category: null,
      energyKcal: 420,
      isMine: true,
    });
    const stored = await Food.findByPk(res.body.id);
    expect(stored.ownerId).toBe(user.id);
    expect(stored.searchName).toBe('granola maison');

    expect((await agent.get('/api/foods/mine')).body.items.map((f) => f.id)).toEqual([res.body.id]);
    expect((await agent.get('/api/foods?q=granola')).body.total).toBe(1);
  });

  it('ne crée qu’avec les calories ; les autres valeurs sont facultatives', async () => {
    const { agent } = await userAgent();
    const res = await agent.post('/api/foods').send({ name: 'Sel', energyKcal: 0 });
    expect(res.status).toBe(201);
    expect(res.body.proteinsG).toBeNull();
  });

  it('refuse les données invalides (400) avec des messages clairs', async () => {
    const { agent } = await userAgent();
    const res = await agent.post('/api/foods').send({ name: '', energyKcal: -5, proteinsG: 200 });
    expect(res.status).toBe(400);
    const messages = Object.fromEntries(res.body.error.details.map((d) => [d.path[0], d.message]));
    expect(messages.name).toBe('Le nom est obligatoire');
    expect(messages.energyKcal).toBe('Les calories ne peuvent pas être négatives');
    expect(messages.proteinsG).toBe('Les protéines pour 100 g ne peuvent pas dépasser 100 g');
    expect((await agent.post('/api/foods').send({ name: 'Sans calories' })).status).toBe(400);
  });

  it('GET /api/foods/mine exclut les aliments archivés et ceux des autres', async () => {
    const { user, agent } = await userAgent();
    const other = await createUser({
      email: 'autre@example.fr',
      firstName: 'Autre',
      lastName: 'Test',
    });
    await createFood({ name: 'À moi', source: 'user', ownerId: user.id });
    await createFood({ name: 'Archivé', source: 'user', ownerId: user.id, archivedAt: new Date() });
    await createFood({ name: 'À l’autre', source: 'user', ownerId: other.id });
    await createFood({ name: 'Commun' });
    const res = await agent.get('/api/foods/mine');
    expect(res.body.items.map((f) => f.name)).toEqual(['À moi']);
    expect(res.body.total).toBe(1);
  });

  it('modifie le sien (200) et met à jour le nom de recherche', async () => {
    const { agent } = await userAgent();
    const id = (await agent.post('/api/foods').send(perso)).body.id;
    const res = await agent
      .patch(`/api/foods/${id}`)
      .send({ name: 'Müesli', energyKcal: 380, brand: null });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ name: 'Müesli', energyKcal: 380, proteinsG: 9 });
    expect((await Food.findByPk(id)).searchName).toBe('muesli');
    expect((await agent.patch(`/api/foods/${id}`).send({})).status).toBe(400);
  });

  it('refuse de modifier ou supprimer un aliment commun ou d’une autre personne (403)', async () => {
    const { agent } = await userAgent();
    const owner = await createUser({
      email: 'autre@example.fr',
      firstName: 'Autre',
      lastName: 'Test',
    });
    const common = await createFood();
    const theirs = await createFood({ name: 'Le sien', source: 'user', ownerId: owner.id });

    expect((await agent.patch(`/api/foods/${common.id}`).send({ name: 'x' })).status).toBe(403);
    expect((await agent.delete(`/api/foods/${common.id}`)).status).toBe(403);
    // un aliment perso que je ne vois pas : 404, pour ne pas révéler qu'il existe
    expect((await agent.patch(`/api/foods/${theirs.id}`).send({ name: 'x' })).status).toBe(404);
    expect((await agent.delete(`/api/foods/${theirs.id}`)).status).toBe(404);
    expect((await Food.findByPk(theirs.id)).name).toBe('Le sien');

    // visible par une recette publique : on le voit, mais il n'est pas à nous (403)
    const recipe = await Recipe.create({
      ownerId: owner.id,
      kind: 'recipe',
      title: 'P',
      visibility: 'public',
    });
    await RecipeIngredient.create({
      recipeId: recipe.id,
      label: 'ingrédient',
      foodId: theirs.id,
      grams: 50,
      position: 0,
    });
    expect((await agent.patch(`/api/foods/${theirs.id}`).send({ name: 'x' })).status).toBe(403);
    expect((await agent.patch('/api/foods/999').send({ name: 'x' })).status).toBe(404);
  });

  it('supprime pour de vrai un aliment jamais utilisé', async () => {
    const { agent } = await userAgent();
    const id = (await agent.post('/api/foods').send(perso)).body.id;
    const res = await agent.delete(`/api/foods/${id}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ result: 'deleted' });
    expect(await Food.findByPk(id)).toBeNull();
    expect((await agent.delete(`/api/foods/${id}`)).status).toBe(404);
  });

  it('archive un aliment utilisé dans une recette : plus listé ni cherché, mais lisible', async () => {
    const { user, agent } = await userAgent();
    const id = (await agent.post('/api/foods').send(perso)).body.id;
    const recipe = await Recipe.create({ ownerId: user.id, kind: 'recipe', title: 'Bol' });
    await RecipeIngredient.create({
      recipeId: recipe.id,
      label: 'ingrédient',
      foodId: id,
      grams: 40,
      position: 0,
    });

    const res = await agent.delete(`/api/foods/${id}`);
    expect(res.body).toEqual({ result: 'archived' });
    expect((await Food.findByPk(id)).archivedAt).not.toBeNull();
    expect((await agent.get('/api/foods/mine')).body.items).toEqual([]);
    expect((await agent.get('/api/foods?q=granola')).body.total).toBe(0);
    expect((await agent.get(`/api/foods/${id}`)).status).toBe(200);
    expect(await RecipeIngredient.count()).toBe(1);
    // déjà archivé : plus modifiable
    expect((await agent.patch(`/api/foods/${id}`).send({ name: 'x' })).status).toBe(404);
  });
});

describe('code-barres d’un aliment perso', () => {
  const code = '3017620422003';

  it('se crée avec un code-barres, se modifie et s’efface avec null', async () => {
    const { agent } = await userAgent();
    const created = await agent.post('/api/foods').send({ ...perso, barcode: code });
    expect(created.status).toBe(201);
    expect(created.body.barcode).toBe(code);

    const changed = await agent
      .patch(`/api/foods/${created.body.id}`)
      .send({ barcode: '12345678' });
    expect(changed.body.barcode).toBe('12345678');
    const cleared = await agent.patch(`/api/foods/${created.body.id}`).send({ barcode: null });
    expect(cleared.status).toBe(200);
    expect(cleared.body.barcode).toBeNull();
  });

  it('est retrouvé au scan avant Open Food Facts (sans l’appeler)', async () => {
    const { agent } = await userAgent();
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const created = await agent.post('/api/foods').send({ ...perso, barcode: code });

    const res = await agent.get(`/api/foods/barcode/${code}`);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: created.body.id, source: 'user', isMine: true });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('passe avant un produit Open Food Facts en cache portant le même code', async () => {
    const { agent } = await userAgent();
    await createFood({ name: 'Produit off', source: 'off', barcode: code, fetchedAt: new Date() });
    const created = await agent.post('/api/foods').send({ ...perso, barcode: code });
    expect(created.status).toBe(201);
    expect((await agent.get(`/api/foods/barcode/${code}`)).body.id).toBe(created.body.id);
  });

  it('n’est jamais trouvé par un autre compte, qui peut avoir le même code', async () => {
    const { agent: alice } = await userAgent({ email: 'alice@example.fr' });
    const { agent: bob } = await userAgent({ email: 'bob@example.fr' });
    const aliceFood = await alice.post('/api/foods').send({ ...perso, barcode: code });

    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve({ ok: true, status: 200, json: async () => ({ status: 0 }) })),
    );
    expect((await bob.get(`/api/foods/barcode/${code}`)).status).toBe(404);

    const bobFood = await bob.post('/api/foods').send({ ...perso, barcode: code });
    expect(bobFood.status).toBe(201);
    expect((await bob.get(`/api/foods/barcode/${code}`)).body.id).toBe(bobFood.body.id);
    expect((await alice.get(`/api/foods/barcode/${code}`)).body.id).toBe(aliceFood.body.id);
  });

  it('refuse un doublon chez la même personne (409), à la création et à la modification', async () => {
    const { agent } = await userAgent();
    await agent
      .post('/api/foods')
      .send({ ...perso, barcode: code })
      .expect(201);

    const dup = await agent.post('/api/foods').send({ ...perso, name: 'Autre', barcode: code });
    expect(dup.status).toBe(409);
    expect(dup.body.error.message).toBe('Tu as déjà un aliment avec ce code-barres');

    const other = await agent.post('/api/foods').send({ ...perso, name: 'Autre' });
    expect((await agent.patch(`/api/foods/${other.body.id}`).send({ barcode: code })).status).toBe(
      409,
    );
  });

  it('accepte de remettre le même code sur le même aliment, et de le réutiliser après suppression', async () => {
    const { agent } = await userAgent();
    const created = await agent.post('/api/foods').send({ ...perso, barcode: code });
    const same = await agent.patch(`/api/foods/${created.body.id}`).send({ barcode: code });
    expect(same.status).toBe(200);

    await agent.delete(`/api/foods/${created.body.id}`).expect(200);
    await agent
      .post('/api/foods')
      .send({ ...perso, barcode: code })
      .expect(201);
  });

  it('ignore un aliment archivé au scan et pour le doublon', async () => {
    const { agent, user } = await userAgent();
    await createFood({
      name: 'Ancien',
      source: 'user',
      ownerId: user.id,
      barcode: code,
      archivedAt: new Date(),
    });
    await agent
      .post('/api/foods')
      .send({ ...perso, barcode: code })
      .expect(201);
    const res = await agent.get(`/api/foods/barcode/${code}`);
    expect(res.body.name).toBe('Granola maison');
  });

  it('refuse un code invalide (400)', async () => {
    const { agent } = await userAgent();
    for (const barcode of ['123', 'abcdefgh', '123456789012345', 12345678]) {
      const res = await agent.post('/api/foods').send({ ...perso, barcode });
      expect(res.status).toBe(400);
    }
    const res = await agent.post('/api/foods').send({ ...perso, barcode: '12' });
    expect(res.body.error.details[0].message).toBe('Le code-barres doit contenir 8 à 14 chiffres');
    const created = await agent.post('/api/foods').send(perso);
    expect(
      (await agent.patch(`/api/foods/${created.body.id}`).send({ barcode: 'xx' })).status,
    ).toBe(400);
  });
});

describe('corrections de l’admin', () => {
  async function setup() {
    const admin = await createAdmin();
    return { admin, agent: await loginAgent(admin), food: await createFood() };
  }

  it('corrige un aliment commun, sans toucher à la valeur d’origine', async () => {
    const { admin, agent, food } = await setup();
    const res = await agent
      .put(`/api/admin/foods/${food.id}/correction`)
      .send({ energyKcal: 140, note: 'Vérifié' });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      isCorrected: true,
      energyKcal: 140,
      proteinsG: 29.8,
      original: { energyKcal: 151 },
      correctionNote: 'Vérifié',
    });
    expect(Number((await Food.findByPk(food.id)).energyKcal)).toBe(151);
    expect((await FoodCorrection.findOne()).correctedById).toBe(admin.id);
  });

  it('remplace la correction précédente (un champ absent = pas corrigé)', async () => {
    const { agent, food } = await setup();
    await agent.put(`/api/admin/foods/${food.id}/correction`).send({ energyKcal: 140, fatsG: 2 });
    const res = await agent
      .put(`/api/admin/foods/${food.id}/correction`)
      .send({ name: 'Poulet rôti' });
    expect(res.body).toMatchObject({ name: 'Poulet rôti', energyKcal: 151, fatsG: 3.5 });
    expect(await FoodCorrection.count()).toBe(1);
  });

  it('corrige aussi un produit Open Food Facts', async () => {
    const { agent } = await setup();
    const off = await createFood({ name: 'Produit', source: 'off', barcode: '12345678' });
    expect(
      (await agent.put(`/api/admin/foods/${off.id}/correction`).send({ proteinsG: 5 })).status,
    ).toBe(200);
  });

  it('refuse un aliment perso (400), une demande vide (400), un aliment introuvable (404)', async () => {
    const { admin, agent } = await setup();
    const mine = await createFood({ name: 'Perso', source: 'user', ownerId: admin.id });
    const res = await agent.put(`/api/admin/foods/${mine.id}/correction`).send({ energyKcal: 1 });
    expect(res.status).toBe(400);
    expect(res.body.error.message).toBe('Seuls les aliments communs peuvent être corrigés');

    const food = await createFood({ name: 'Autre' });
    expect((await agent.put(`/api/admin/foods/${food.id}/correction`).send({})).status).toBe(400);
    expect(
      (await agent.put(`/api/admin/foods/${food.id}/correction`).send({ note: 'seule' })).status,
    ).toBe(400);
    expect(
      (await agent.put(`/api/admin/foods/${food.id}/correction`).send({ energyKcal: -1 })).status,
    ).toBe(400);
    expect(
      (await agent.put('/api/admin/foods/999/correction').send({ energyKcal: 1 })).status,
    ).toBe(404);
  });

  it('liste les aliments corrigés, puis retire la correction (retour à l’origine)', async () => {
    const { agent, food } = await setup();
    const other = await createFood({ name: 'Non corrigé' });
    await agent.put(`/api/admin/foods/${food.id}/correction`).send({ energyKcal: 140 });

    const list = await agent.get('/api/admin/foods/corrections');
    expect(list.body).toMatchObject({ total: 1, page: 1 });
    expect(list.body.items.map((f) => f.id)).toEqual([food.id]);
    expect(list.body.items.map((f) => f.id)).not.toContain(other.id);

    expect((await agent.delete(`/api/admin/foods/${food.id}/correction`)).status).toBe(204);
    expect(await FoodCorrection.count()).toBe(0);
    expect((await agent.get(`/api/foods/${food.id}`)).body.energyKcal).toBe(151);
    expect((await agent.delete('/api/admin/foods/999/correction')).status).toBe(404);
  });
});

describe('Open Food Facts', () => {
  const nutella = {
    code: '3017620422003',
    product_name_fr: 'Nutella',
    brands: 'Ferrero, Autre',
    categories: 'Petit-déjeuners, Pâtes à tartiner',
    nutriments: {
      'energy-kcal_100g': 539,
      proteins_100g: 6.3,
      carbohydrates_100g: 57.5,
      fat_100g: 30.9,
    },
  };

  const reply = (body, status = 200) =>
    Promise.resolve({ ok: status < 400, status, json: async () => body });

  function mockFetch(handler) {
    const fetchMock = vi.fn(handler);
    vi.stubGlobal('fetch', fetchMock);
    return fetchMock;
  }

  it('lit un code-barres chez Open Food Facts et le garde en base', async () => {
    const { agent } = await userAgent();
    const fetchMock = mockFetch(() => reply({ status: 1, product: nutella }));

    const res = await agent.get('/api/foods/barcode/3017620422003');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      source: 'off',
      name: 'Nutella',
      brand: 'Ferrero',
      category: 'Pâtes à tartiner',
      barcode: '3017620422003',
      energyKcal: 539,
      proteinsG: 6.3,
    });
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toContain('/api/v2/product/3017620422003.json');
    expect(options.headers['user-agent']).toContain('Mijote');

    const stored = await Food.findOne({ where: { barcode: '3017620422003' } });
    expect(stored).toMatchObject({ source: 'off', searchName: 'nutella' });
    expect(stored.fetchedAt).toBeInstanceOf(Date);
  });

  it('relit ensuite le cache sans rappeler Open Food Facts', async () => {
    const { agent } = await userAgent();
    const fetchMock = mockFetch(() => reply({ status: 1, product: nutella }));
    await agent.get('/api/foods/barcode/3017620422003').expect(200);
    await agent.get('/api/foods/barcode/3017620422003').expect(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(await Food.count()).toBe(1);
  });

  it('rafraîchit un produit gardé depuis plus de 90 jours, en conservant la correction', async () => {
    const { agent } = await userAgent();
    const old = await createFood({
      name: 'Nutella ancien',
      source: 'off',
      barcode: '3017620422003',
      energyKcal: 500,
      fetchedAt: new Date(Date.now() - 100 * 86_400_000),
    });
    await FoodCorrection.create({ foodId: old.id, proteinsG: 7 });
    mockFetch(() => reply({ status: 1, product: nutella }));

    const res = await agent.get('/api/foods/barcode/3017620422003');
    expect(res.body).toMatchObject({ id: old.id, name: 'Nutella', energyKcal: 539, proteinsG: 7 });
    expect(res.body.original.proteinsG).toBe(6.3);
    expect(await Food.count()).toBe(1);
  });

  it('renvoie le cache ancien si Open Food Facts ne répond pas', async () => {
    const { agent } = await userAgent();
    await createFood({
      name: 'Nutella ancien',
      source: 'off',
      barcode: '3017620422003',
      fetchedAt: new Date(Date.now() - 100 * 86_400_000),
    });
    mockFetch(() => Promise.reject(new Error('réseau')));
    const res = await agent.get('/api/foods/barcode/3017620422003');
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Nutella ancien');
  });

  it('renvoie 404 pour un produit inconnu, 502 si le service est en panne, 400 pour un code invalide', async () => {
    const { agent } = await userAgent();
    mockFetch(() => reply({ status: 0, status_verbose: 'product not found' }, 404));
    const notFound = await agent.get('/api/foods/barcode/12345678');
    expect(notFound.status).toBe(404);
    expect(notFound.body.error.message).toBe('Produit introuvable : ajoute-le à la main');

    mockFetch(() => reply({}, 503));
    expect((await agent.get('/api/foods/barcode/12345678')).status).toBe(502);
    mockFetch(() => Promise.reject(new Error('timeout')));
    const down = await agent.get('/api/foods/barcode/12345678');
    expect(down.status).toBe(502);
    expect(down.body.error.message).toBe('Open Food Facts ne répond pas, réessaie plus tard');

    expect((await agent.get('/api/foods/barcode/123')).status).toBe(400);
    expect((await agent.get('/api/foods/barcode/abcdefgh')).status).toBe(400);
    expect(await Food.count()).toBe(0);
  });

  it('calcule les calories depuis les kJ et ignore les valeurs aberrantes', async () => {
    const { agent } = await userAgent();
    mockFetch(() =>
      reply({
        status: 1,
        product: {
          code: '12345678',
          product_name: 'Biscuit',
          nutriments: { energy_100g: 2092, proteins_100g: 'abc', fat_100g: 5000 },
        },
      }),
    );
    const res = await agent.get('/api/foods/barcode/12345678');
    expect(res.body).toMatchObject({ energyKcal: 500, proteinsG: null, fatsG: null, brand: null });
  });

  it('recherche chez Open Food Facts, garde les résultats et ignore les produits sans nom', async () => {
    const { agent } = await userAgent();
    const fetchMock = mockFetch(() =>
      reply({
        products: [
          nutella,
          { code: '22222222', nutriments: {} },
          { ...nutella, code: '33333333', product_name_fr: 'Pâte noisette' },
        ],
      }),
    );
    const res = await agent.get('/api/foods/off/search?q=nutella');
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(2);
    expect(res.body.items.map((f) => f.name)).toEqual(['Nutella', 'Pâte noisette']);
    expect(fetchMock.mock.calls[0][0]).toContain('search_terms=nutella');
    expect(await Food.count({ where: { source: 'off' } })).toBe(2);
    // retrouvés ensuite par la recherche normale
    expect((await agent.get('/api/foods?q=noisette')).body.total).toBe(1);
  });

  it('refuse une recherche trop courte (400) et signale la panne (502)', async () => {
    const { agent } = await userAgent();
    expect((await agent.get('/api/foods/off/search?q=n')).status).toBe(400);
    mockFetch(() => reply({}, 500));
    expect((await agent.get('/api/foods/off/search?q=nutella')).status).toBe(502);
    mockFetch(() => reply({}, 404));
    expect((await agent.get('/api/foods/off/search?q=nutella')).status).toBe(502);
  });

  it('limite commune : 10 recherches Open Food Facts par minute pour tout le serveur (429)', async () => {
    const alice = await userAgent();
    const bob = await userAgent({ email: 'camille@example.fr', firstName: 'Camille' });
    resetRateLimits();
    const fetchMock = mockFetch(() => reply({ products: [] }));
    for (let i = 0; i < 5; i++) {
      expect((await alice.agent.get('/api/foods/off/search?q=nutella')).status).toBe(200);
      expect((await bob.agent.get('/api/foods/off/search?q=nutella')).status).toBe(200);
    }
    const refused = await alice.agent.get('/api/foods/off/search?q=nutella');
    expect(refused.status).toBe(429);
    expect(refused.body.error.message).toMatch(/réessaie dans une minute/);
    expect(fetchMock).toHaveBeenCalledTimes(10);
  });

  it('limite commune : 15 lectures de produit par minute ; un produit en cache ne compte pas', async () => {
    const { agent } = await userAgent();
    const fetchMock = mockFetch(() => reply({ status: 0 }));
    for (let i = 0; i < 15; i++) {
      const code = String(30000000 + i);
      expect((await agent.get(`/api/foods/barcode/${code}`)).status).toBe(404);
    }
    expect((await agent.get('/api/foods/barcode/30000099')).status).toBe(429);
    expect(fetchMock).toHaveBeenCalledTimes(15);
  });
});
