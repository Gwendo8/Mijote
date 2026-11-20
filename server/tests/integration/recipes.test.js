import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import app from '../../src/app.js';
import { Food, FoodCorrection, Recipe, RecipeShare } from '../../src/models/index.js';
import {
  createFood,
  createRecipe,
  createTag,
  createUser,
  loginAgent,
  resetAll,
} from '../helpers.js';

beforeEach(resetAll);

async function userAgent(overrides) {
  const user = await createUser(overrides);
  return { user, agent: await loginAgent(user) };
}

const other = { email: 'camille@example.fr', firstName: 'Camille', lastName: 'Durand' };

// Corps minimal d'une recette ; chaque test ajoute ce dont il a besoin
const body = (extra = {}) => ({
  kind: 'recipe',
  title: 'Poulet au citron',
  servings: 2,
  ingredients: [],
  ...extra,
});

describe('routes /api/recipes : droits', () => {
  it('refusent sans session (401)', async () => {
    expect((await request(app).get('/api/recipes')).status).toBe(401);
    expect((await request(app).get('/api/recipes/1')).status).toBe(401);
    expect((await request(app).post('/api/recipes').send(body())).status).toBe(401);
    expect((await request(app).put('/api/recipes/1').send(body())).status).toBe(401);
    expect((await request(app).delete('/api/recipes/1')).status).toBe(401);
    expect((await request(app).post('/api/recipes/1/copy')).status).toBe(401);
    expect(
      (await request(app).post('/api/recipes/import').send({ url: 'https://a.fr' })).status,
    ).toBe(401);
    expect((await request(app).get('/api/recipes/1/photo')).status).toBe(401);
    expect((await request(app).put('/api/recipes/1/photo')).status).toBe(401);
    expect((await request(app).delete('/api/recipes/1/photo')).status).toBe(401);
  });
});

describe('POST /api/recipes', () => {
  it('crée une recette avec ingrédients, étiquettes et calcule les calories par part', async () => {
    const { user, agent } = await userAgent();
    const poulet = await createFood({ name: 'Poulet', energyKcal: 150, proteinsG: 30 });
    const tag = await createTag('Plat');

    const res = await agent.post('/api/recipes').send(
      body({
        description: 'Simple',
        instructions: 'Couper.\nCuire.',
        prepTimeMinutes: 10,
        tagIds: [tag.id],
        ingredients: [
          { foodId: poulet.id, grams: 400 },
          { label: 'Une pincée de sel', isNegligible: true },
        ],
      }),
    );

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      kind: 'recipe',
      title: 'Poulet au citron',
      visibility: 'private',
      isMine: true,
      owner: { id: user.id, firstName: 'Gwen', lastName: 'Martin' },
      sharedWith: [],
      copiedFrom: null,
      photoUrl: null,
      tags: [{ id: tag.id, name: 'Plat' }],
    });
    expect(res.body.ingredients).toHaveLength(2);
    expect(res.body.ingredients[0]).toMatchObject({
      position: 0,
      label: 'Poulet', // sans texte, le nom de l'aliment
      grams: 400,
      food: { id: poulet.id, name: 'Poulet' },
    });
    expect(res.body.ingredients[1]).toMatchObject({ isNegligible: true, food: null });
    expect(res.body.nutrition).toMatchObject({
      caloriesPerServing: 300,
      proteinsPerServing: 60,
      caloriesSource: 'computed',
      isComplete: true,
      missingIngredients: 0,
      total: { calories: 600, proteins: 120 },
      perServing: { calories: 300, proteins: 60 },
    });
  });

  it('renvoie « à compléter » tant qu’un ingrédient n’a ni aliment ni grammes', async () => {
    const { agent } = await userAgent();
    const res = await agent
      .post('/api/recipes')
      .send(body({ ingredients: [{ label: '2 citrons' }] }));
    expect(res.status).toBe(201);
    expect(res.body.nutrition).toMatchObject({
      caloriesPerServing: null,
      proteinsPerServing: null,
      isComplete: false,
      missingIngredients: 1,
    });
  });

  it('la correction à la main remplace le calcul', async () => {
    const { agent } = await userAgent();
    const res = await agent.post('/api/recipes').send(
      body({
        ingredients: [{ label: '2 citrons' }],
        caloriesPerServingManual: 450,
        proteinsPerServingManual: 25.5,
      }),
    );
    expect(res.body.nutrition).toMatchObject({
      caloriesPerServing: 450,
      proteinsPerServing: 25.5,
      caloriesSource: 'manual',
      proteinsSource: 'manual',
    });
  });

  it('utilise la valeur corrigée de l’aliment et compte un aliment archivé', async () => {
    const { agent } = await userAgent();
    const food = await createFood({ name: 'Riz', energyKcal: 130, proteinsG: 3 });
    await FoodCorrection.create({ foodId: food.id, energyKcal: 100 });
    const res = await agent
      .post('/api/recipes')
      .send(body({ servings: 1, ingredients: [{ foodId: food.id, grams: 200 }] }));
    expect(res.body.nutrition.caloriesPerServing).toBe(200);
    expect(res.body.nutrition.proteinsPerServing).toBe(6);

    await food.update({ archivedAt: new Date() });
    const again = await agent.get(`/api/recipes/${res.body.id}`);
    expect(again.body.nutrition.caloriesPerServing).toBe(200);
  });

  it('refuse un aliment archivé dans une nouvelle recette (400)', async () => {
    const { user, agent } = await userAgent();
    const food = await createFood({ source: 'user', ownerId: user.id, archivedAt: new Date() });
    const res = await agent
      .post('/api/recipes')
      .send(body({ ingredients: [{ foodId: food.id, grams: 100 }] }));
    expect(res.status).toBe(400);
    expect(res.body.error.details[0].path).toEqual(['ingredients', 0, 'foodId']);
  });

  it('refuse l’aliment perso d’une autre personne ou un aliment inconnu (400)', async () => {
    const { agent } = await userAgent();
    const camille = await createUser(other);
    const secret = await createFood({ source: 'user', ownerId: camille.id });
    for (const foodId of [secret.id, 99999]) {
      const res = await agent
        .post('/api/recipes')
        .send(body({ ingredients: [{ foodId, grams: 100 }] }));
      expect(res.status).toBe(400);
    }
  });

  it('une idée de plat exige un aliment avec ses grammes et ignore les étapes', async () => {
    const { agent } = await userAgent();
    const food = await createFood();
    const refused = await agent
      .post('/api/recipes')
      .send(body({ kind: 'idea', ingredients: [{ label: 'Du poulet' }] }));
    expect(refused.status).toBe(400);
    expect(refused.body.error.details[0].path).toEqual(['ingredients']);

    const res = await agent.post('/api/recipes').send(
      body({
        kind: 'idea',
        instructions: 'à ignorer',
        prepTimeMinutes: 5,
        ingredients: [{ foodId: food.id, grams: 100 }],
      }),
    );
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      kind: 'idea',
      instructions: null,
      prepTimeMinutes: null,
    });
  });

  it('refuse les données invalides avec un message par champ (400)', async () => {
    const { agent } = await userAgent();
    const res = await agent.post('/api/recipes').send({
      kind: 'plat',
      title: '',
      servings: 0,
      sourceUrl: 'pas-une-adresse',
      ingredients: [{ grams: -5 }],
    });
    expect(res.status).toBe(400);
    const messages = Object.fromEntries(
      res.body.error.details.map((d) => [d.path.join('.'), d.message]),
    );
    expect(messages.kind).toBe('Le type doit être « recipe » ou « idea »');
    expect(messages.title).toBe('Le titre est obligatoire');
    expect(messages.servings).toBe('Il faut au moins 1 part');
    expect(messages.sourceUrl).toMatch(/http/);
    expect(messages['ingredients.0.grams']).toBe('Les grammes doivent être supérieurs à 0');
    expect(messages['ingredients.0.label']).toBe('Écris l’ingrédient ou choisis un aliment');
  });

  it('refuse un partage sans personne, avec un message clair (400)', async () => {
    const { agent } = await userAgent();
    const res = await agent.post('/api/recipes').send(body({ visibility: 'shared' }));
    expect(res.status).toBe(400);
    expect(res.body.error.details[0]).toMatchObject({ path: ['sharedWith'] });
    expect(res.body.error.details[0].message).toMatch(/au moins une personne/);
  });

  it('refuse une étiquette inconnue ou un partage avec soi-même ou un inconnu (400)', async () => {
    const { user, agent } = await userAgent();
    expect((await agent.post('/api/recipes').send(body({ tagIds: [999] }))).status).toBe(400);
    const shared = (sharedWith) => body({ visibility: 'shared', sharedWith });
    expect((await agent.post('/api/recipes').send(shared([user.id]))).status).toBe(400);
    expect((await agent.post('/api/recipes').send(shared([999]))).status).toBe(400);
  });
});

describe('visibilité et droits', () => {
  it('une recette privée est introuvable (404) pour les autres, et ne se modifie pas', async () => {
    const { user } = await userAgent();
    const recipe = await createRecipe(user);
    const { agent } = await userAgent(other);
    expect((await agent.get(`/api/recipes/${recipe.id}`)).status).toBe(404);
    expect((await agent.put(`/api/recipes/${recipe.id}`).send(body())).status).toBe(404);
    expect((await agent.delete(`/api/recipes/${recipe.id}`)).status).toBe(404);
    expect((await agent.post(`/api/recipes/${recipe.id}/copy`)).status).toBe(404);
    expect((await agent.get('/api/recipes/999')).status).toBe(404);
  });

  it('une recette partagée n’est vue que par les personnes choisies, et l’autrice seule voit la liste', async () => {
    const { agent: gwen } = await userAgent();
    const camille = await createUser(other);
    const jules = await createUser({
      email: 'jules@example.fr',
      firstName: 'Jules',
      lastName: 'Test',
    });
    const created = await gwen
      .post('/api/recipes')
      .send(body({ visibility: 'shared', sharedWith: [camille.id] }));
    expect(created.body.sharedWith).toEqual([
      { id: camille.id, firstName: 'Camille', lastName: 'Durand' },
    ]);

    const camilleAgent = await loginAgent(camille);
    const seen = await camilleAgent.get(`/api/recipes/${created.body.id}`);
    expect(seen.status).toBe(200);
    expect(seen.body).toMatchObject({
      isMine: false,
      owner: { firstName: 'Gwen', lastName: 'Martin' },
    });
    expect(seen.body).not.toHaveProperty('sharedWith');

    expect((await (await loginAgent(jules)).get(`/api/recipes/${created.body.id}`)).status).toBe(
      404,
    );
  });

  it('une recette publique est vue par tous les comptes connectés', async () => {
    const { user } = await userAgent();
    const recipe = await createRecipe(user, { visibility: 'public' });
    const { agent } = await userAgent(other);
    expect((await agent.get(`/api/recipes/${recipe.id}`)).status).toBe(200);
  });

  it('une recette vue mais pas à soi refuse toute modification (403)', async () => {
    const { user } = await userAgent();
    const recipe = await createRecipe(user, { visibility: 'public' });
    const { agent } = await userAgent(other);
    expect((await agent.put(`/api/recipes/${recipe.id}`).send(body())).status).toBe(403);
    expect((await agent.delete(`/api/recipes/${recipe.id}`)).status).toBe(403);
    expect((await agent.delete(`/api/recipes/${recipe.id}/photo`)).status).toBe(403);
    expect(await Recipe.count()).toBe(1);
  });

  it('un partage retiré fait disparaître la recette pour la personne', async () => {
    const { agent: gwen } = await userAgent();
    const camille = await createUser(other);
    const created = await gwen
      .post('/api/recipes')
      .send(body({ visibility: 'shared', sharedWith: [camille.id] }));
    const camilleAgent = await loginAgent(camille);
    await gwen.put(`/api/recipes/${created.body.id}`).send(body({ visibility: 'private' }));
    expect((await camilleAgent.get(`/api/recipes/${created.body.id}`)).status).toBe(404);
    expect(await RecipeShare.count()).toBe(0);
  });

  it('les aliments perso de l’autrice restent lisibles dans la recette partagée', async () => {
    const { user } = await userAgent();
    const maison = await createFood({ source: 'user', ownerId: user.id, name: 'Granola maison' });
    const recipe = await createRecipe(user, {
      visibility: 'public',
      ingredients: [{ food: maison, grams: 50 }],
    });
    const { agent } = await userAgent(other);
    const res = await agent.get(`/api/recipes/${recipe.id}`);
    expect(res.body.ingredients[0].food).toMatchObject({ name: 'Granola maison', isMine: false });
  });
});

describe('PUT et DELETE /api/recipes/:id', () => {
  it('remplace le contenu : ingrédients, étiquettes et partages', async () => {
    const { user, agent } = await userAgent();
    const camille = await createUser(other);
    const food = await createFood();
    const tag1 = await createTag('Plat', 0);
    const tag2 = await createTag('Végé', 1);
    const recipe = await createRecipe(user, { ingredients: [{ label: 'ancien' }] });

    const res = await agent.put(`/api/recipes/${recipe.id}`).send(
      body({
        title: 'Nouveau titre',
        kind: 'idea', // le type ne change pas
        visibility: 'shared',
        sharedWith: [camille.id],
        tagIds: [tag1.id, tag2.id],
        ingredients: [{ foodId: food.id, grams: 100 }],
      }),
    );
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      kind: 'recipe',
      title: 'Nouveau titre',
      visibility: 'shared',
    });
    expect(res.body.ingredients).toHaveLength(1);
    expect(res.body.tags.map((t) => t.name)).toEqual(['Plat', 'Végé']);
    expect(res.body.sharedWith).toHaveLength(1);
  });

  it('garde un aliment archivé déjà présent dans la recette', async () => {
    const { user, agent } = await userAgent();
    const food = await createFood({ source: 'user', ownerId: user.id });
    const recipe = await createRecipe(user, { ingredients: [{ food, grams: 100 }] });
    await food.update({ archivedAt: new Date() });
    const res = await agent
      .put(`/api/recipes/${recipe.id}`)
      .send(body({ ingredients: [{ foodId: food.id, grams: 150 }] }));
    expect(res.status).toBe(200);
  });

  it('refuse les données invalides (400) et une recette inconnue (404)', async () => {
    const { user, agent } = await userAgent();
    const recipe = await createRecipe(user);
    expect((await agent.put(`/api/recipes/${recipe.id}`).send({ title: '' })).status).toBe(400);
    expect((await agent.put('/api/recipes/abc').send(body())).status).toBe(400);
    expect((await agent.put('/api/recipes/999').send(body())).status).toBe(404);
  });

  it('supprime la recette (204)', async () => {
    const { user, agent } = await userAgent();
    const recipe = await createRecipe(user, { ingredients: [{ label: 'x' }] });
    expect((await agent.delete(`/api/recipes/${recipe.id}`)).status).toBe(204);
    expect(await Recipe.count()).toBe(0);
    expect((await agent.get(`/api/recipes/${recipe.id}`)).status).toBe(404);
  });
});

describe('POST /api/recipes/:id/copy', () => {
  it('copie une recette publique : privée, à moi, avec étiquettes et lien vers l’original', async () => {
    const { user: gwen } = await userAgent();
    const tag = await createTag('Plat');
    const maison = await createFood({
      source: 'user',
      ownerId: gwen.id,
      name: 'Granola maison',
      energyKcal: 420,
    });
    const ciqual = await createFood({ name: 'Poulet' });
    const recipe = await createRecipe(gwen, {
      visibility: 'public',
      title: 'Bol du matin',
      ingredients: [
        { food: maison, grams: 50 },
        { food: ciqual, grams: 100 },
      ],
    });
    await (await Recipe.findByPk(recipe.id)).addTag(tag);

    const { user: camille, agent } = await userAgent(other);
    const res = await agent.post(`/api/recipes/${recipe.id}/copy`);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      title: 'Bol du matin',
      visibility: 'private',
      isMine: true,
      copiedFrom: { id: recipe.id, title: 'Bol du matin' },
      tags: [{ id: tag.id, name: 'Plat' }],
    });
    const [copiedMaison, copiedCiqual] = res.body.ingredients.map((i) => i.food);
    // l'aliment perso de l'autrice est copié chez moi ; l'aliment commun reste le même
    expect(copiedMaison.id).not.toBe(maison.id);
    expect(copiedMaison).toMatchObject({ name: 'Granola maison', isMine: true, energyKcal: 420 });
    expect(await Food.count({ where: { ownerId: camille.id } })).toBe(1);
    expect(copiedCiqual.id).toBe(ciqual.id);
    expect(res.body.nutrition.isComplete).toBe(true);
  });

  it('dupliquer sa propre recette garde ses aliments perso', async () => {
    const { user, agent } = await userAgent();
    const maison = await createFood({ source: 'user', ownerId: user.id });
    const recipe = await createRecipe(user, { ingredients: [{ food: maison, grams: 50 }] });
    const res = await agent.post(`/api/recipes/${recipe.id}/copy`);
    expect(res.status).toBe(201);
    expect(res.body.ingredients[0].food.id).toBe(maison.id);
    expect(await Food.count({ where: { source: 'user' } })).toBe(1);
  });

  it('l’original disparu ou plus visible : copiedFrom vaut null', async () => {
    const { user: gwen } = await userAgent();
    const recipe = await createRecipe(gwen, { visibility: 'public' });
    const { agent } = await userAgent(other);
    const copy = (await agent.post(`/api/recipes/${recipe.id}/copy`)).body;
    await recipe.update({ visibility: 'private' });
    expect((await agent.get(`/api/recipes/${copy.id}`)).body.copiedFrom).toBeNull();
  });
});

describe('GET /api/recipes (liste, recherche et filtres)', () => {
  it('liste ce que je vois, avec isMine, et pagine', async () => {
    const { user, agent } = await userAgent();
    const camille = await createUser(other);
    await createRecipe(user, { title: 'A moi' });
    await createRecipe(camille, { title: 'Publique', visibility: 'public' });
    await createRecipe(camille, { title: 'Privée de Camille' });
    const shared = await createRecipe(camille, { title: 'Partagée', visibility: 'shared' });
    await RecipeShare.create({ recipeId: shared.id, userId: user.id });

    const all = await agent.get('/api/recipes');
    expect(all.status).toBe(200);
    expect(all.body).toMatchObject({ total: 3, page: 1, limit: 20 });
    expect(all.body.items.map((i) => i.title).sort()).toEqual(['A moi', 'Partagée', 'Publique']);
    expect(all.body.items.find((i) => i.title === 'A moi').isMine).toBe(true);
    expect(all.body.items[0]).not.toHaveProperty('ingredients');
    expect(all.body.items[0].nutrition).not.toHaveProperty('total');

    const titles = async (query) =>
      (await agent.get(`/api/recipes?${query}`)).body.items.map((i) => i.title);
    expect(await titles('scope=mine')).toEqual(['A moi']);
    expect(await titles('scope=shared')).toEqual(['Partagée']);
    expect(await titles('scope=public')).toEqual(['Publique']);
    expect(await titles(`ownerId=${camille.id}`)).toHaveLength(2);

    const page = await agent.get('/api/recipes?limit=2&page=2&sort=title');
    expect(page.body).toMatchObject({ total: 3, page: 2, limit: 2 });
    expect(page.body.items.map((i) => i.title)).toEqual(['Publique']);
  });

  it('filtre par type et par étiquettes (toutes celles demandées)', async () => {
    const { user, agent } = await userAgent();
    const plat = await createTag('Plat', 0);
    const vege = await createTag('Végé', 1);
    const a = await createRecipe(user, { title: 'Les deux' });
    const b = await createRecipe(user, { title: 'Plat seul' });
    await createRecipe(user, { title: 'Une idée', kind: 'idea' });
    await a.addTags([plat, vege]);
    await b.addTag(plat);

    const titles = async (query) =>
      (await agent.get(`/api/recipes?${query}&sort=title`)).body.items.map((i) => i.title);
    expect(await titles(`tagIds=${plat.id}`)).toEqual(['Les deux', 'Plat seul']);
    expect(await titles(`tagIds=${plat.id},${vege.id}`)).toEqual(['Les deux']);
    expect(await titles('kind=idea')).toEqual(['Une idée']);
    expect((await agent.get('/api/recipes?tagIds=a,b')).status).toBe(400);
  });

  it('cherche dans le titre et le texte des ingrédients, sans accents ni majuscules', async () => {
    const { user, agent } = await userAgent();
    await createRecipe(user, { title: 'Crème brûlée' });
    await createRecipe(user, {
      title: 'Soupe',
      ingredients: [{ label: '2 poireaux' }, { label: 'Crème fraîche' }],
    });
    await createRecipe(user, { title: 'Salade', ingredients: [{ label: 'laitue' }] });

    const titles = async (q) =>
      (await agent.get('/api/recipes').query({ q, sort: 'title' })).body.items.map((i) => i.title);
    expect(await titles('CREME')).toEqual(['Crème brûlée', 'Soupe']);
    expect(await titles('creme fraiche')).toEqual(['Soupe']); // tous les mots, ici dans un ingrédient
    expect(await titles('poireau')).toEqual(['Soupe']);
    expect(await titles('100%')).toEqual([]); // % cherché comme un caractère
  });

  it('filtre et trie par calories et protéines par part ; « à compléter » exclu ou en dernier', async () => {
    const { user, agent } = await userAgent();
    const food = await createFood({ energyKcal: 100, proteinsG: 10 });
    await createRecipe(user, { title: 'Léger', ingredients: [{ food, grams: 100 }] }); // 100 kcal, 10 g
    await createRecipe(user, { title: 'Copieux', ingredients: [{ food, grams: 500 }] }); // 500 kcal, 50 g
    await createRecipe(user, { title: 'Inconnu', ingredients: [{ label: 'du mystère' }] });
    await createRecipe(user, {
      title: 'Corrigé',
      ingredients: [{ label: 'du mystère' }],
      caloriesPerServingManual: 300,
    });

    const titles = async (query) =>
      (await agent.get(`/api/recipes?${query}`)).body.items.map((i) => i.title);
    expect(await titles('sort=calories')).toEqual(['Léger', 'Corrigé', 'Copieux', 'Inconnu']);
    expect(await titles('sort=calories&order=desc')).toEqual([
      'Copieux',
      'Corrigé',
      'Léger',
      'Inconnu',
    ]);
    expect(await titles('sort=proteins')).toEqual(['Copieux', 'Léger', 'Inconnu', 'Corrigé']);
    expect(await titles('maxCalories=300&sort=calories')).toEqual(['Léger', 'Corrigé']);
    expect(await titles('minProteins=20')).toEqual(['Copieux']);
    const page = await agent.get('/api/recipes?maxCalories=300&sort=calories&limit=1&page=2');
    expect(page.body).toMatchObject({ total: 2, page: 2 });
    expect(page.body.items.map((i) => i.title)).toEqual(['Corrigé']);
  });

  it('refuse un filtre invalide (400)', async () => {
    const { agent } = await userAgent();
    expect((await agent.get('/api/recipes?scope=tout')).status).toBe(400);
    expect((await agent.get('/api/recipes?sort=prix')).status).toBe(400);
    expect((await agent.get('/api/recipes?limit=500')).status).toBe(400);
    expect((await agent.get('/api/recipes?maxCalories=abc')).status).toBe(400);
  });
});
