import * as mealPlanEntriesRepository from '../repositories/meal-plan-entries.repository.js';
import * as mealSlotsRepository from '../repositories/meal-slots.repository.js';
import * as recipesRepository from '../repositories/recipes.repository.js';
import { inTransaction } from '../repositories/transactions.js';
import * as usersRepository from '../repositories/users.repository.js';
import { addDays, mondayOf, today } from '../utils/dates.js';
import { HttpError } from '../utils/HttpError.js';
import { insertAt } from '../utils/positions.js';
import { canSee, findVisible, nutritionOf, photoUrl } from './recipes.service.js';
import { toSlot } from './meal-slots.service.js';
import { canView } from './planning-shares.service.js';

const num = (value) => (value === null || value === undefined ? null : Number(value));
const round1 = (value) => Math.round(value * 10) / 10;

// ---------- Présentation d'une entrée ----------

// Calcule ce que l'on montre d'une entrée, et les dernières valeurs à retenir :
// - recette encore visible pour la propriétaire du planning : valeurs fraîches, retenues si elles ont changé ;
// - recette invisible ou supprimée : dernières valeurs connues × parts, qui comptent toujours ;
// - texte libre : les calories saisies.
function presentEntry(entry, recipes, ownerId, viewerId) {
  const recipe = entry.recipeId ? recipes.get(entry.recipeId) : null;
  const storedKcal = num(entry.lastKnownKcalPerServing);
  const storedProteins = num(entry.lastKnownProteinsPerServing);
  const manual = num(entry.caloriesManual);

  let kcalPerServing = storedKcal;
  let proteinsPerServing = storedProteins;
  if (recipe && canSee(recipe, ownerId)) {
    const nutrition = nutritionOf(recipe);
    if (nutrition.caloriesPerServing !== null) kcalPerServing = nutrition.caloriesPerServing;
    if (nutrition.proteinsPerServing !== null) proteinsPerServing = nutrition.proteinsPerServing;
  }
  const changed = kcalPerServing !== storedKcal || proteinsPerServing !== storedProteins;

  // Recette supprimée : l'entrée n'a plus de recette mais garde ses dernières valeurs
  const deleted =
    !entry.recipeId && manual === null && (storedKcal !== null || storedProteins !== null);
  const fromRecipe = Boolean(entry.recipeId) || deleted;
  const parts = num(entry.servings) ?? 1;
  const times = (value) => (value === null ? null : round1(value * parts));

  let recipeAvailable = null;
  if (entry.recipeId) recipeAvailable = Boolean(recipe && canSee(recipe, viewerId));
  else if (deleted) recipeAvailable = false;

  return {
    view: {
      id: entry.id,
      date: entry.date,
      slotId: entry.mealSlotId,
      position: entry.position,
      label: entry.label,
      servings: num(entry.servings),
      caloriesManual: manual,
      recipe: recipeAvailable
        ? {
            id: recipe.id,
            kind: recipe.kind,
            title: recipe.title,
            photoUrl: photoUrl(recipe),
            isMine: recipe.ownerId === viewerId,
          }
        : null,
      recipeAvailable,
      lastKnownKcalPerServing: kcalPerServing,
      lastKnownProteinsPerServing: proteinsPerServing,
      calories: fromRecipe ? times(kcalPerServing) : manual,
      proteins: fromRecipe ? times(proteinsPerServing) : null,
    },
    update: changed
      ? { lastKnownKcalPerServing: kcalPerServing, lastKnownProteinsPerServing: proteinsPerServing }
      : null,
  };
}

// Présente plusieurs entrées d'une même personne. Les dernières valeurs connues ne sont écrites
// que si elles ont changé, et seulement quand c'est la propriétaire qui lit.
async function presentEntries(entries, ownerId, viewerId) {
  const recipeIds = [...new Set(entries.map((entry) => entry.recipeId).filter(Boolean))];
  const recipes = new Map(
    (await recipesRepository.findManyFull(recipeIds)).map((recipe) => [recipe.id, recipe]),
  );
  const results = entries.map((entry) => presentEntry(entry, recipes, ownerId, viewerId));
  if (viewerId === ownerId) {
    await Promise.all(
      results.map(({ update }, index) =>
        update ? mealPlanEntriesRepository.updateLastKnown(entries[index].id, update) : null,
      ),
    );
  }
  return results.map(({ view }) => view);
}

const presentOne = async (entry, ownerId) => (await presentEntries([entry], ownerId, ownerId))[0];

// ---------- Semaine ----------

export async function getWeek(viewerId, { week, userId }) {
  const weekStart = mondayOf(week ?? today());
  const weekEnd = addDays(weekStart, 6);
  const ownerId = userId ?? viewerId;

  // Le planning d'une autre personne : 404 s'il ne m'est pas partagé (on ne révèle rien)
  if (ownerId !== viewerId && !(await canView(ownerId, viewerId, weekStart))) {
    throw new HttpError(404, 'Planning introuvable');
  }
  const owner = await usersRepository.findById(ownerId);
  if (!owner) throw new HttpError(404, 'Planning introuvable');

  const [slots, entries] = await Promise.all([
    mealSlotsRepository.listOfUser(ownerId),
    mealPlanEntriesRepository.listBetween(ownerId, weekStart, weekEnd),
  ]);
  const views = await presentEntries(entries, ownerId, viewerId);

  // Les créneaux masqués ne sont listés que s'ils contiennent des entrées cette semaine
  const usedSlots = new Set(views.map((view) => view.slotId));
  const slotOrder = new Map(slots.map((slot) => [slot.id, slot.position]));
  const shownSlots = slots.filter((slot) => !slot.isHidden || usedSlots.has(slot.id));

  const days = Array.from({ length: 7 }, (_, index) => {
    const date = addDays(weekStart, index);
    const dayEntries = views
      .filter((view) => view.date === date)
      .sort(
        (a, b) =>
          slotOrder.get(a.slotId) - slotOrder.get(b.slotId) ||
          a.position - b.position ||
          a.id - b.id,
      );
    return { date, entries: dayEntries, ...totalsOf(dayEntries, 'totalCalories', 'totalProteins') };
  });

  return {
    weekStart,
    weekEnd,
    owner: { id: owner.id, firstName: owner.firstName, lastName: owner.lastName },
    isMine: ownerId === viewerId,
    slots: shownSlots.map(toSlot),
    days,
    totals: totalsOf(views, 'calories', 'proteins'),
  };
}

// Les totaux ignorent les entrées dont les calories sont inconnues (unknownCount dit combien)
function totalsOf(entries, caloriesKey, proteinsKey) {
  const sum = (field) => round1(entries.reduce((total, entry) => total + (entry[field] ?? 0), 0));
  return {
    [caloriesKey]: sum('calories'),
    [proteinsKey]: sum('proteins'),
    unknownCount: entries.filter((entry) => entry.calories === null).length,
  };
}

// ---------- Entrées ----------

async function ownedSlot(userId, slotId, options) {
  const slot = await mealSlotsRepository.findOwned(userId, slotId, options);
  if (!slot) throw new HttpError(404, 'Créneau introuvable');
  return slot;
}

async function ownedEntry(userId, id, options) {
  const entry = await mealPlanEntriesRepository.findOwned(userId, id, options);
  if (!entry) throw new HttpError(404, 'Entrée introuvable');
  return entry;
}

export async function addEntry(userId, body) {
  await ownedSlot(userId, body.slotId);
  // Une recette qu'on ne voit pas (ou plus) : 404, comme si elle n'existait pas
  const recipe = body.recipeId ? await findVisible(userId, body.recipeId) : null;

  const entry = await inTransaction(async (transaction) =>
    mealPlanEntriesRepository.create(
      {
        userId,
        date: body.date,
        mealSlotId: body.slotId,
        position: await mealPlanEntriesRepository.nextPosition(userId, body.date, body.slotId, {
          transaction,
        }),
        recipeId: recipe?.id ?? null,
        label: body.label ?? recipe?.title,
        servings: body.servings ?? null,
        caloriesManual: body.caloriesManual ?? null,
      },
      { transaction },
    ),
  );
  // Les dernières valeurs connues sont retenues dès l'ajout
  return presentOne(entry, userId);
}

export async function updateEntry(userId, id, body) {
  const entry = await ownedEntry(userId, id);
  if (body.caloriesManual != null && entry.recipeId) {
    throw new HttpError(400, 'Données invalides', [
      {
        path: ['caloriesManual'],
        message: 'Les calories se saisissent seulement pour un texte libre',
        code: 'custom',
      },
    ]);
  }
  const moves = ['date', 'slotId', 'position'].some((key) => body[key] !== undefined);
  if (body.slotId !== undefined) await ownedSlot(userId, body.slotId);

  await inTransaction(async (transaction) => {
    const fields = {};
    for (const key of ['label', 'servings', 'caloriesManual']) {
      if (body[key] !== undefined) fields[key] = body[key];
    }
    // Une recette supprimée qui devient texte libre n'a plus de valeurs à retenir
    if (body.caloriesManual != null) {
      fields.lastKnownKcalPerServing = null;
      fields.lastKnownProteinsPerServing = null;
    }
    if (Object.keys(fields).length > 0) {
      await mealPlanEntriesRepository.update(entry, fields, { transaction });
    }
    if (moves) await move(userId, entry, body, transaction);
  });

  return presentOne(await ownedEntry(userId, id), userId);
}

// Déplace une entrée (autre jour, autre créneau ou autre rang) et renumérote les cases touchées
async function move(userId, entry, body, transaction) {
  const from = { date: entry.date, slotId: entry.mealSlotId };
  const to = { date: body.date ?? from.date, slotId: body.slotId ?? from.slotId };
  const sameCell = from.date === to.date && from.slotId === to.slotId;

  const renumber = async (items, extra = () => ({})) => {
    for (const [position, item] of items.entries()) {
      const data = { position, ...extra(item) };
      const changed = Object.entries(data).some(([key, value]) => item[key] !== value);
      if (changed) await mealPlanEntriesRepository.update(item, data, { transaction });
    }
  };
  const cell = async (cellKey) =>
    (
      await mealPlanEntriesRepository.listCell(userId, cellKey.date, cellKey.slotId, {
        transaction,
      })
    ).filter((item) => item.id !== entry.id);

  if (!sameCell) await renumber(await cell(from));
  const target = insertAt(await cell(to), entry, body.position);
  await renumber(target, (item) =>
    item.id === entry.id ? { date: to.date, mealSlotId: to.slotId } : {},
  );
}

export async function removeEntry(userId, id) {
  const entry = await ownedEntry(userId, id);
  await mealPlanEntriesRepository.remove(entry);
}
