import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import app from '../../src/app.js';
import { MealPlanEntry, MealSlot, Recipe, RecipeShare } from '../../src/models/index.js';
import { createDefaults } from '../../src/repositories/meal-slots.repository.js';
import { createFood, createRecipe, createUser, loginAgent, resetAll } from '../helpers.js';

beforeEach(resetAll);

const WEEK = '2026-11-16'; // un lundi
const other = { email: 'camille@example.fr', firstName: 'Camille', lastName: 'Durand' };

// Une personne connectée, avec ses 4 créneaux par défaut (créés à l'inscription en vrai)
async function userAgent(overrides) {
  const user = await createUser(overrides);
  await createDefaults(user.id);
  const slots = await MealSlot.findAll({
    where: { userId: user.id },
    order: [['position', 'ASC']],
  });
  return { user, agent: await loginAgent(user), slots };
}

// Poulet 100 g : 151 kcal et 29,8 g de protéines pour 1 part
async function chicken(owner, data = {}) {
  const food = await createFood();
  return createRecipe(owner, { ingredients: [{ food, grams: 100 }], ...data });
}

const addEntry = (agent, slot, extra = {}) =>
  agent.post('/api/planning/entries').send({ date: '2026-11-17', slotId: slot.id, ...extra });

describe('routes /api/planning : droits', () => {
  it('refusent sans session (401)', async () => {
    for (const [method, url] of [
      ['get', '/api/planning'],
      ['post', '/api/planning/entries'],
      ['patch', '/api/planning/entries/1'],
      ['delete', '/api/planning/entries/1'],
      ['get', '/api/planning/slots'],
      ['post', '/api/planning/slots'],
      ['patch', '/api/planning/slots/1'],
      ['delete', '/api/planning/slots/1'],
      ['get', '/api/planning/shares'],
      ['post', '/api/planning/shares'],
      ['delete', '/api/planning/shares/1'],
      ['get', '/api/planning/shared-with-me'],
    ]) {
      expect((await request(app)[method](url)).status, `${method} ${url}`).toBe(401);
    }
  });
});

describe('créneaux', () => {
  it('liste les 4 créneaux par défaut dans l’ordre', async () => {
    const { agent } = await userAgent();
    const res = await agent.get('/api/planning/slots').expect(200);
    expect(res.body.map((s) => s.name)).toEqual(['Petit-déjeuner', 'Midi', 'Collation', 'Soir']);
    expect(res.body[0]).toMatchObject({ isDefault: true, isHidden: false, position: 0 });
  });

  it('ajoute un créneau en dernier, refuse un doublon (409) et un nom vide (400)', async () => {
    const { agent } = await userAgent();
    const res = await agent.post('/api/planning/slots').send({ name: 'Goûter' }).expect(201);
    expect(res.body).toMatchObject({ name: 'Goûter', isDefault: false, position: 4 });
    const again = await agent.post('/api/planning/slots').send({ name: 'goûter' });
    expect(again.status).toBe(409);
    expect(again.body.error.message).toBe('Ce créneau existe déjà');
    const empty = await agent.post('/api/planning/slots').send({ name: '  ' });
    expect(empty.status).toBe(400);
    expect(empty.body.error.details[0].path).toEqual(['name']);
  });

  it('masque, renomme et réordonne', async () => {
    const { agent, slots } = await userAgent();
    const hidden = await agent.patch(`/api/planning/slots/${slots[2].id}`).send({ isHidden: true });
    expect(hidden.body.isHidden).toBe(true);
    await agent.patch(`/api/planning/slots/${slots[1].id}`).send({ name: 'Déjeuner' }).expect(200);
    await agent.patch(`/api/planning/slots/${slots[3].id}`).send({ position: 0 }).expect(200);
    const list = (await agent.get('/api/planning/slots')).body;
    expect(list.map((s) => s.name)).toEqual(['Soir', 'Petit-déjeuner', 'Déjeuner', 'Collation']);
    expect(list.map((s) => s.position)).toEqual([0, 1, 2, 3]);
    expect(
      (await agent.patch(`/api/planning/slots/${slots[1].id}`).send({ name: 'Soir' })).status,
    ).toBe(409);
    expect((await agent.patch(`/api/planning/slots/${slots[1].id}`).send({})).status).toBe(400);
  });

  it('ne touche pas aux créneaux des autres (404)', async () => {
    const { agent } = await userAgent();
    const { slots } = await userAgent(other);
    expect(
      (await agent.patch(`/api/planning/slots/${slots[0].id}`).send({ isHidden: true })).status,
    ).toBe(404);
    expect((await agent.delete(`/api/planning/slots/${slots[0].id}`)).status).toBe(404);
  });

  it('refuse de supprimer un créneau par défaut (400) mais supprime un ajouté avec son contenu', async () => {
    const { agent, user, slots } = await userAgent();
    const refused = await agent.delete(`/api/planning/slots/${slots[0].id}`);
    expect(refused.status).toBe(400);
    expect(refused.body.error.message).toBe(
      'Les créneaux par défaut se masquent, ils ne se suppriment pas',
    );

    const added = (await agent.post('/api/planning/slots').send({ name: 'Goûter' })).body;
    await addEntry(agent, added, { label: 'Gâteau', caloriesManual: 200 }).expect(201);
    await agent.delete(`/api/planning/slots/${added.id}`).expect(204);
    expect(await MealPlanEntry.count({ where: { userId: user.id } })).toBe(0);
  });
});

describe('entrées', () => {
  it('ajoute une recette : titre, calories et dernières valeurs retenues dès l’ajout', async () => {
    const { agent, user, slots } = await userAgent();
    const recipe = await chicken(user);
    const res = await addEntry(agent, slots[1], { recipeId: recipe.id, servings: 1.5 }).expect(201);
    expect(res.body).toMatchObject({
      date: '2026-11-17',
      slotId: slots[1].id,
      position: 0,
      label: 'Poulet au citron',
      servings: 1.5,
      recipeAvailable: true,
      recipe: { id: recipe.id, kind: 'recipe', title: 'Poulet au citron', isMine: true },
      lastKnownKcalPerServing: 151,
      lastKnownProteinsPerServing: 29.8,
      calories: 226.5,
      proteins: 44.7,
    });
    const stored = await MealPlanEntry.findByPk(res.body.id);
    expect(Number(stored.lastKnownKcalPerServing)).toBe(151);
  });

  it('ajoute un texte libre avec ses calories, et plusieurs plats dans la même case', async () => {
    const { agent, slots } = await userAgent();
    const first = await addEntry(agent, slots[0], { label: 'Café', caloriesManual: 20 });
    const second = await addEntry(agent, slots[0], { label: 'Tartine' });
    expect(first.body).toMatchObject({
      recipe: null,
      recipeAvailable: null,
      calories: 20,
      proteins: null,
    });
    expect(second.body).toMatchObject({ position: 1, calories: null });
  });

  it('refuse les données invalides (400)', async () => {
    const { agent, user, slots } = await userAgent();
    const recipe = await chicken(user);
    const noTitle = await addEntry(agent, slots[0]);
    expect(noTitle.status).toBe(400);
    expect(noTitle.body.error.details[0].message).toBe('Choisis une recette ou écris un titre');
    expect((await addEntry(agent, slots[0], { label: 'x', date: '2026-02-30' })).status).toBe(400);
    expect((await addEntry(agent, slots[0], { label: 'x', servings: 0 })).status).toBe(400);
    const manualWithRecipe = await addEntry(agent, slots[0], {
      recipeId: recipe.id,
      caloriesManual: 5,
    });
    expect(manualWithRecipe.status).toBe(400);
  });

  it('refuse une recette invisible ou inconnue et un créneau qui n’est pas à moi (404)', async () => {
    const { agent, slots } = await userAgent();
    const { user: camille, slots: theirSlots } = await userAgent(other);
    const secret = await chicken(camille);
    expect((await addEntry(agent, slots[0], { recipeId: secret.id })).status).toBe(404);
    expect((await addEntry(agent, slots[0], { recipeId: 9999 })).status).toBe(404);
    expect((await addEntry(agent, theirSlots[0], { label: 'x' })).status).toBe(404);
  });

  it('accepte une recette partagée avec moi, avec isMine à false', async () => {
    const { agent, slots } = await userAgent();
    const { user: camille } = await userAgent(other);
    const recipe = await chicken(camille, { visibility: 'public' });
    const res = await addEntry(agent, slots[0], { recipeId: recipe.id }).expect(201);
    expect(res.body.recipe.isMine).toBe(false);
  });

  it('modifie les parts, le titre et les calories d’un texte libre', async () => {
    const { agent, user, slots } = await userAgent();
    const recipe = await chicken(user);
    const entry = (await addEntry(agent, slots[0], { recipeId: recipe.id })).body;
    const res = await agent
      .patch(`/api/planning/entries/${entry.id}`)
      .send({ servings: 2, label: 'Poulet' });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ servings: 2, label: 'Poulet', calories: 302 });
    const forbidden = await agent
      .patch(`/api/planning/entries/${entry.id}`)
      .send({ caloriesManual: 100 });
    expect(forbidden.status).toBe(400);

    const free = (await addEntry(agent, slots[0], { label: 'Pain' })).body;
    const edited = await agent
      .patch(`/api/planning/entries/${free.id}`)
      .send({ caloriesManual: 90 });
    expect(edited.body.calories).toBe(90);
    expect((await agent.patch(`/api/planning/entries/${free.id}`).send({})).status).toBe(400);
  });

  it('déplace vers une autre case et renumérote les positions', async () => {
    const { agent, slots } = await userAgent();
    const a = (await addEntry(agent, slots[0], { label: 'A' })).body;
    const b = (await addEntry(agent, slots[0], { label: 'B' })).body;
    const c = (await addEntry(agent, slots[0], { label: 'C' })).body;
    await addEntry(agent, slots[1], { label: 'D' });

    // même case : C passe en tête
    await agent.patch(`/api/planning/entries/${c.id}`).send({ position: 0 }).expect(200);
    // B part dans la case de D, au rang 0, un autre jour
    const moved = await agent
      .patch(`/api/planning/entries/${b.id}`)
      .send({ slotId: slots[1].id, position: 0 });
    expect(moved.body).toMatchObject({ slotId: slots[1].id, position: 0 });

    const week = (await agent.get(`/api/planning?week=${WEEK}`)).body;
    const labels = week.days[1].entries.map(
      (e) => `${e.label}${e.slotId === slots[0].id ? '@0' : '@1'}:${e.position}`,
    );
    expect(labels).toEqual(['C@0:0', 'A@0:1', 'B@1:0', 'D@1:1']);

    const otherDay = await agent
      .patch(`/api/planning/entries/${a.id}`)
      .send({ date: '2026-11-18' });
    expect(otherDay.body).toMatchObject({ date: '2026-11-18', position: 0 });
  });

  it('refuse de déplacer vers un créneau inconnu (404) et les entrées des autres (404)', async () => {
    const { agent, slots } = await userAgent();
    const { agent: camille, slots: theirSlots } = await userAgent(other);
    const mine = (await addEntry(agent, slots[0], { label: 'A' })).body;
    expect(
      (await agent.patch(`/api/planning/entries/${mine.id}`).send({ slotId: theirSlots[0].id }))
        .status,
    ).toBe(404);
    expect(
      (await camille.patch(`/api/planning/entries/${mine.id}`).send({ label: 'x' })).status,
    ).toBe(404);
    expect((await camille.delete(`/api/planning/entries/${mine.id}`)).status).toBe(404);
    expect((await agent.delete('/api/planning/entries/9999')).status).toBe(404);
  });

  it('supprime une entrée (204)', async () => {
    const { agent, slots } = await userAgent();
    const entry = (await addEntry(agent, slots[0], { label: 'A' })).body;
    await agent.delete(`/api/planning/entries/${entry.id}`).expect(204);
    expect(await MealPlanEntry.count()).toBe(0);
  });
});

describe('semaine', () => {
  it('renvoie 7 jours du lundi au dimanche, les totaux par jour et pour la semaine', async () => {
    const { agent, user, slots } = await userAgent();
    const recipe = await chicken(user);
    await addEntry(agent, slots[1], { recipeId: recipe.id, servings: 2 });
    await addEntry(agent, slots[3], { label: 'Pain', caloriesManual: 100, date: '2026-11-19' });
    await addEntry(agent, slots[3], { label: 'Inconnu', date: '2026-11-19' });
    await addEntry(agent, slots[3], {
      label: 'Hors semaine',
      caloriesManual: 999,
      date: '2026-11-23',
    });

    const res = await agent.get('/api/planning?week=2026-11-20').expect(200);
    expect(res.body).toMatchObject({
      weekStart: '2026-11-16',
      weekEnd: '2026-11-22',
      isMine: true,
      owner: { id: user.id, firstName: 'Gwen', lastName: 'Martin' },
    });
    expect(res.body.days.map((d) => d.date)).toEqual([
      '2026-11-16',
      '2026-11-17',
      '2026-11-18',
      '2026-11-19',
      '2026-11-20',
      '2026-11-21',
      '2026-11-22',
    ]);
    expect(res.body.days[1]).toMatchObject({
      totalCalories: 302,
      totalProteins: 59.6,
      unknownCount: 0,
    });
    expect(res.body.days[3]).toMatchObject({ totalCalories: 100, unknownCount: 1 });
    expect(res.body.totals).toMatchObject({ calories: 402, proteins: 59.6, unknownCount: 1 });
    expect(res.body.slots).toHaveLength(4);
  });

  it('prend la semaine en cours sans paramètre, et refuse une date invalide (400)', async () => {
    const { agent } = await userAgent();
    const res = await agent.get('/api/planning').expect(200);
    expect(res.body.days).toHaveLength(7);
    expect((await agent.get('/api/planning?week=demain')).status).toBe(400);
  });

  it('cache les créneaux masqués, sauf s’ils contiennent des entrées cette semaine', async () => {
    const { agent, slots } = await userAgent();
    await agent.patch(`/api/planning/slots/${slots[2].id}`).send({ isHidden: true });
    await agent.patch(`/api/planning/slots/${slots[0].id}`).send({ isHidden: true });
    await addEntry(agent, slots[0], { label: 'Café' });
    const shown = (await agent.get(`/api/planning?week=${WEEK}`)).body.slots.map((s) => s.name);
    expect(shown).toEqual(['Petit-déjeuner', 'Midi', 'Soir']);
    const nextWeek = (await agent.get('/api/planning?week=2026-11-23')).body.slots.map(
      (s) => s.name,
    );
    expect(nextWeek).toEqual(['Midi', 'Soir']);
  });
});

describe('dernières calories connues', () => {
  it('suit la recette quand elle change, sans écrire si rien n’a changé', async () => {
    const { agent, user, slots } = await userAgent();
    const recipe = await chicken(user);
    const entry = (await addEntry(agent, slots[0], { recipeId: recipe.id })).body;

    const before = (await MealPlanEntry.findByPk(entry.id)).updatedAt;
    await new Promise((resolve) => setTimeout(resolve, 20));
    await agent.get(`/api/planning?week=${WEEK}`).expect(200);
    expect((await MealPlanEntry.findByPk(entry.id)).updatedAt).toEqual(before);
    const countUpdates = async () =>
      (await MealPlanEntry.findByPk(entry.id)).lastKnownKcalPerServing;
    expect(Number(await countUpdates())).toBe(151);

    await recipe.update({ caloriesPerServingManual: 300 });
    const week = (await agent.get(`/api/planning?week=${WEEK}`)).body;
    expect(week.days[1].entries[0]).toMatchObject({ lastKnownKcalPerServing: 300, calories: 300 });
    expect(Number(await countUpdates())).toBe(300);
  });

  it('garde titre et calories quand le partage est retiré, et les compte dans le total', async () => {
    const { agent, slots } = await userAgent();
    const { user: camille } = await userAgent(other);
    const recipe = await chicken(camille, { visibility: 'public' });
    await addEntry(agent, slots[0], { recipeId: recipe.id, servings: 2 }).expect(201);

    await recipe.update({ visibility: 'private' });
    const week = (await agent.get(`/api/planning?week=${WEEK}`)).body;
    expect(week.days[1].entries[0]).toMatchObject({
      label: 'Poulet au citron',
      recipe: null,
      recipeAvailable: false,
      calories: 302,
    });
    expect(week.days[1].totalCalories).toBe(302);
    // un nouvel ajout est refusé
    expect((await addEntry(agent, slots[0], { recipeId: recipe.id })).status).toBe(404);
  });

  it('garde les valeurs quand la recette est supprimée', async () => {
    const { agent, user, slots } = await userAgent();
    const recipe = await chicken(user);
    await addEntry(agent, slots[0], { recipeId: recipe.id }).expect(201);
    await Recipe.destroy({ where: { id: recipe.id } });
    const entry = (await agent.get(`/api/planning?week=${WEEK}`)).body.days[1].entries[0];
    expect(entry).toMatchObject({
      recipe: null,
      recipeAvailable: false,
      calories: 151,
      label: 'Poulet au citron',
    });
  });

  it('retient une recette « à compléter » : calories inconnues, comptées dans unknownCount', async () => {
    const { agent, user, slots } = await userAgent();
    const incomplete = await createRecipe(user, { ingredients: [{ label: 'Sel', grams: null }] });
    const entry = (await addEntry(agent, slots[0], { recipeId: incomplete.id })).body;
    expect(entry).toMatchObject({ calories: null, recipeAvailable: true });
    const week = (await agent.get(`/api/planning?week=${WEEK}`)).body;
    expect(week.totals.unknownCount).toBe(1);
  });
});

describe('partage du planning', () => {
  it('crée, liste et retire un partage', async () => {
    const { agent } = await userAgent();
    const { user: camille } = await userAgent(other);
    const created = await agent
      .post('/api/planning/shares')
      .send({ userId: camille.id, weekStart: '2026-11-19' })
      .expect(201);
    expect(created.body).toMatchObject({
      user: { id: camille.id, firstName: 'Camille', lastName: 'Durand' },
      weekStart: '2026-11-16',
    });
    await agent.post('/api/planning/shares').send({ userId: null, weekStart: null }).expect(201);
    const list = (await agent.get('/api/planning/shares')).body;
    expect(list).toHaveLength(2);
    expect(list[0]).toMatchObject({ user: null, weekStart: null });
    await agent.delete(`/api/planning/shares/${created.body.id}`).expect(204);
    expect((await agent.get('/api/planning/shares')).body).toHaveLength(1);
  });

  it('refuse un doublon (409), une personne inconnue (404), soi-même et les données invalides (400)', async () => {
    const { agent, user } = await userAgent();
    const { user: camille } = await userAgent(other);
    await agent
      .post('/api/planning/shares')
      .send({ userId: camille.id, weekStart: null })
      .expect(201);
    const dup = await agent
      .post('/api/planning/shares')
      .send({ userId: camille.id, weekStart: null });
    expect(dup.status).toBe(409);
    expect(dup.body.error.message).toBe('Déjà partagé');
    await agent.post('/api/planning/shares').send({ userId: null, weekStart: null }).expect(201);
    expect(
      (await agent.post('/api/planning/shares').send({ userId: null, weekStart: null })).status,
    ).toBe(409);
    expect(
      (await agent.post('/api/planning/shares').send({ userId: 9999, weekStart: null })).status,
    ).toBe(404);
    expect(
      (await agent.post('/api/planning/shares').send({ userId: user.id, weekStart: null })).status,
    ).toBe(400);
    expect((await agent.post('/api/planning/shares').send({ userId: camille.id })).status).toBe(
      400,
    );
  });

  it('ne retire pas le partage de quelqu’un d’autre (404)', async () => {
    const { agent } = await userAgent();
    const { agent: camille, user } = await userAgent(other);
    const share = (
      await agent.post('/api/planning/shares').send({ userId: user.id, weekStart: null })
    ).body;
    expect((await camille.delete(`/api/planning/shares/${share.id}`)).status).toBe(404);
  });

  it('laisse lire le planning partagé en lecture seule, sans ouvrir les recettes invisibles', async () => {
    const { agent, user, slots } = await userAgent();
    const { agent: camille, user: camilleUser } = await userAgent(other);
    const recipe = await chicken(user); // privée
    await addEntry(agent, slots[1], { recipeId: recipe.id, servings: 2 }).expect(201);

    // pas encore partagé : 404
    expect((await camille.get(`/api/planning?week=${WEEK}&userId=${user.id}`)).status).toBe(404);

    await agent
      .post('/api/planning/shares')
      .send({ userId: camilleUser.id, weekStart: WEEK })
      .expect(201);
    const res = await camille.get(`/api/planning?week=${WEEK}&userId=${user.id}`).expect(200);
    expect(res.body).toMatchObject({
      isMine: false,
      owner: { id: user.id, firstName: 'Gwen', lastName: 'Martin' },
    });
    expect(res.body.days[1].entries[0]).toMatchObject({
      label: 'Poulet au citron',
      recipe: null,
      recipeAvailable: false,
      calories: 302,
    });
    // une autre semaine reste fermée
    expect((await camille.get(`/api/planning?week=2026-11-23&userId=${user.id}`)).status).toBe(404);
    // et rien ne s'écrit : le planning de Gwen est intact et Camille ne peut rien modifier
    const entryId = res.body.days[1].entries[0].id;
    expect(
      (await camille.patch(`/api/planning/entries/${entryId}`).send({ servings: 5 })).status,
    ).toBe(404);
    expect((await camille.delete(`/api/planning/entries/${entryId}`)).status).toBe(404);
  });

  it('ouvre la recette à la lectrice si elle peut la voir', async () => {
    const { agent, user, slots } = await userAgent();
    const { agent: camille } = await userAgent(other);
    const recipe = await chicken(user, { visibility: 'public' });
    await addEntry(agent, slots[1], { recipeId: recipe.id }).expect(201);
    await agent.post('/api/planning/shares').send({ userId: null, weekStart: null }).expect(201);
    const res = await camille.get(`/api/planning?week=${WEEK}&userId=${user.id}`).expect(200);
    expect(res.body.days[1].entries[0]).toMatchObject({
      recipeAvailable: true,
      recipe: { id: recipe.id, isMine: false },
    });
  });

  it('liste ceux qui me partagent leur planning', async () => {
    const { agent, user } = await userAgent();
    const { agent: camille, user: camilleUser } = await userAgent(other);
    await agent
      .post('/api/planning/shares')
      .send({ userId: camilleUser.id, weekStart: WEEK })
      .expect(201);
    await agent
      .post('/api/planning/shares')
      .send({ userId: camilleUser.id, weekStart: '2026-11-23' })
      .expect(201);
    await camille.post('/api/planning/shares').send({ userId: null, weekStart: null }).expect(201);
    const res = await camille.get('/api/planning/shared-with-me').expect(200);
    expect(res.body).toEqual([
      {
        owner: { id: user.id, firstName: 'Gwen', lastName: 'Martin' },
        allWeeks: false,
        weeks: [WEEK, '2026-11-23'],
      },
    ]);
    // Camille ne se voit pas elle-même ; Gwen voit Camille (partage à tout le monde)
    const mine = (await agent.get('/api/planning/shared-with-me')).body;
    expect(mine).toEqual([
      {
        owner: { id: camilleUser.id, firstName: 'Camille', lastName: 'Durand' },
        allWeeks: true,
        weeks: [],
      },
    ]);
  });
});

// Une recette partagée à une seule personne reste lisible par elle
describe('recette partagée à une personne', () => {
  it('est ajoutable par la personne destinataire', async () => {
    const { agent, slots, user } = await userAgent();
    const { user: camille } = await userAgent(other);
    const recipe = await chicken(camille, { visibility: 'shared' });
    await RecipeShare.create({ recipeId: recipe.id, userId: user.id });
    await addEntry(agent, slots[0], { recipeId: recipe.id }).expect(201);
  });
});
