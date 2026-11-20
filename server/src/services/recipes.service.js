import * as foodsRepository from '../repositories/foods.repository.js';
import * as recipesRepository from '../repositories/recipes.repository.js';
import * as tagsRepository from '../repositories/tags.repository.js';
import { inTransaction } from '../repositories/transactions.js';
import * as usersRepository from '../repositories/users.repository.js';
import { HttpError } from '../utils/HttpError.js';
import { computeNutrition } from '../utils/nutrition.js';
import { offsetOf, paginated } from '../utils/pagination.js';
import { toFood } from './foods.service.js';
import * as photos from './recipe-photos.service.js';

const num = (value) => (value === null || value === undefined ? null : Number(value));

// Erreur de validation dans le même format que celles de Zod, pour que le front l'affiche sous le bon champ
const invalid = (path, message) =>
  new HttpError(400, 'Données invalides', [{ path, message, code: 'custom' }]);

// ---------- Droits ----------

export const canSee = (recipe, userId) =>
  recipe.ownerId === userId ||
  recipe.visibility === 'public' ||
  (recipe.visibility === 'shared' && recipe.shares.some((share) => share.userId === userId));

// Recette qu'on a le droit de voir, sinon 404 (on ne révèle pas qu'elle existe)
export async function findVisible(userId, id) {
  const recipe = await recipesRepository.findFull(id);
  if (!recipe || !canSee(recipe, userId)) throw new HttpError(404, 'Recette introuvable');
  return recipe;
}

// Recette modifiable : 404 si on ne la voit pas, 403 si on la voit sans être son autrice
async function findOwned(userId, id) {
  const recipe = await findVisible(userId, id);
  if (recipe.ownerId !== userId) {
    throw new HttpError(403, 'Tu ne peux modifier que tes propres recettes');
  }
  return recipe;
}

// ---------- Présentation ----------

export const photoUrl = (recipe) =>
  recipe.photoPath
    ? `/api/recipes/${recipe.id}/photo?v=${Math.floor(recipe.updatedAt.getTime() / 1000)}`
    : null;

export const nutritionOf = (recipe) =>
  computeNutrition({
    ingredients: recipe.ingredients.map((ingredient) => ({
      grams: ingredient.grams,
      isNegligible: ingredient.isNegligible,
      food: ingredient.food,
    })),
    servings: recipe.servings,
    manualCalories: recipe.caloriesPerServingManual,
    manualProteins: recipe.proteinsPerServingManual,
  });

// Dans les listes, pas de total ni de détail par part
function nutritionShort(nutrition) {
  // eslint-disable-next-line no-unused-vars
  const { total, perServing, ...rest } = nutrition;
  return rest;
}

function toListItem(recipe, userId, nutrition = nutritionOf(recipe)) {
  return {
    id: recipe.id,
    kind: recipe.kind,
    title: recipe.title,
    description: recipe.description,
    servings: recipe.servings,
    prepTimeMinutes: recipe.prepTimeMinutes,
    cookTimeMinutes: recipe.cookTimeMinutes,
    photoUrl: photoUrl(recipe),
    visibility: recipe.visibility,
    owner: { id: recipe.owner.id, displayName: recipe.owner.displayName },
    isMine: recipe.ownerId === userId,
    tags: recipe.tags.map((tag) => ({ id: tag.id, name: tag.name })),
    nutrition: nutritionShort(nutrition),
    createdAt: recipe.createdAt,
    updatedAt: recipe.updatedAt,
  };
}

async function toDetail(recipe, userId) {
  const mine = recipe.ownerId === userId;
  const origin = recipe.copiedFrom;
  const originVisible =
    origin && (await recipesRepository.isVisibleTo(origin.id, userId)) ? origin : null;

  return {
    id: recipe.id,
    kind: recipe.kind,
    title: recipe.title,
    description: recipe.description,
    instructions: recipe.instructions,
    servings: recipe.servings,
    prepTimeMinutes: recipe.prepTimeMinutes,
    cookTimeMinutes: recipe.cookTimeMinutes,
    sourceUrl: recipe.sourceUrl,
    photoUrl: photoUrl(recipe),
    visibility: recipe.visibility,
    owner: { id: recipe.owner.id, displayName: recipe.owner.displayName },
    isMine: mine,
    ...(mine && {
      sharedWith: recipe.shares.map((share) => ({
        id: share.user.id,
        displayName: share.user.displayName,
      })),
    }),
    copiedFrom: originVisible ? { id: originVisible.id, title: originVisible.title } : null,
    caloriesPerServingManual: num(recipe.caloriesPerServingManual),
    proteinsPerServingManual: num(recipe.proteinsPerServingManual),
    tags: recipe.tags.map((tag) => ({ id: tag.id, name: tag.name })),
    ingredients: recipe.ingredients.map((ingredient) => ({
      id: ingredient.id,
      position: ingredient.position,
      label: ingredient.label,
      grams: num(ingredient.grams),
      isNegligible: ingredient.isNegligible,
      food: ingredient.food ? toFood(ingredient.food, userId) : null,
    })),
    nutrition: nutritionOf(recipe),
    createdAt: recipe.createdAt,
    updatedAt: recipe.updatedAt,
  };
}

export async function get(userId, id) {
  return toDetail(await findVisible(userId, id), userId);
}

// ---------- Liste ----------

const DEFAULT_ORDER = { recent: 'desc', title: 'asc', calories: 'asc', proteins: 'desc' };

// Les valeurs « à compléter » (null) passent toujours en dernier
function byNutrition(field, direction) {
  return (a, b) => {
    const x = a.nutrition[field];
    const y = b.nutrition[field];
    if (x === null && y === null) return a.id - b.id;
    if (x === null) return 1;
    if (y === null) return -1;
    return (direction === 'asc' ? x - y : y - x) || a.id - b.id;
  };
}

export async function list(userId, query) {
  const order = query.order ?? DEFAULT_ORDER[query.sort];
  // eslint-disable-next-line no-unused-vars -- la page et la limite ne servent qu'à découper le résultat
  const { page, limit, ...criteria } = query;
  const filters = { userId, ...criteria, order };
  const nutritionSort = query.sort === 'calories' || query.sort === 'proteins';
  const nutritionFilter = query.maxCalories !== undefined || query.minProteins !== undefined;

  // Titre et date : la base trie et découpe. Calories et protéines ne sont pas stockées : on les calcule
  // sur toutes les recettes qui correspondent, puis on filtre, trie et découpe ici.
  if (!nutritionSort && !nutritionFilter) {
    const { ids, total } = await recipesRepository.search({
      ...filters,
      offset: offsetOf(query),
      limit: query.limit,
    });
    const recipes = await recipesRepository.findManyFull(ids);
    return paginated(
      recipes.map((recipe) => toListItem(recipe, userId)),
      total,
      query,
    );
  }

  const { ids } = await recipesRepository.search(filters);
  let items = (await recipesRepository.findManyFull(ids)).map((recipe) =>
    toListItem(recipe, userId),
  );
  // « À compléter » : exclu dès qu'un filtre de calories ou de protéines est actif
  if (query.maxCalories !== undefined) {
    items = items.filter(
      (item) =>
        item.nutrition.caloriesPerServing !== null &&
        item.nutrition.caloriesPerServing <= query.maxCalories,
    );
  }
  if (query.minProteins !== undefined) {
    items = items.filter(
      (item) =>
        item.nutrition.proteinsPerServing !== null &&
        item.nutrition.proteinsPerServing >= query.minProteins,
    );
  }
  if (nutritionSort) {
    const field = query.sort === 'calories' ? 'caloriesPerServing' : 'proteinsPerServing';
    items.sort(byNutrition(field, order));
  }
  const start = offsetOf(query);
  return paginated(items.slice(start, start + query.limit), items.length, query);
}

// ---------- Création, modification ----------

const isUsableFood = (food, userId, alreadyInRecipe) =>
  (food.source !== 'user' || food.ownerId === userId) && (!food.archivedAt || alreadyInRecipe);

// Vérifie le corps et prépare ce qui sera écrit : { fields, ingredients, tagIds, shareIds }
async function prepare(userId, kind, body, currentFoodIds = []) {
  const foodIds = [...new Set(body.ingredients.map((i) => i.foodId).filter(Boolean))];
  const foods = new Map((await foodsRepository.findManyByIds(foodIds)).map((f) => [f.id, f]));
  body.ingredients.forEach((ingredient, index) => {
    if (!ingredient.foodId) return;
    const food = foods.get(ingredient.foodId);
    if (!food || !isUsableFood(food, userId, currentFoodIds.includes(food.id))) {
      throw invalid(
        ['ingredients', index, 'foodId'],
        'Cet aliment n’existe pas ou n’est pas disponible',
      );
    }
  });

  const ingredients = body.ingredients.map((ingredient) => {
    const food = foods.get(ingredient.foodId);
    return {
      label: ingredient.label || food.correction?.name || food.name,
      foodId: ingredient.foodId ?? null,
      grams: ingredient.grams ?? null,
      isNegligible: ingredient.isNegligible,
    };
  });

  if (kind === 'idea' && !ingredients.some((i) => i.foodId && i.grams)) {
    throw invalid(
      ['ingredients'],
      'Une idée de plat doit contenir au moins un aliment avec ses grammes',
    );
  }

  const tagIds = [...new Set(body.tagIds)];
  if (tagIds.length > 0 && (await tagsRepository.findByIds(tagIds)).length !== tagIds.length) {
    throw invalid(['tagIds'], 'Une des étiquettes n’existe pas');
  }

  let shareIds = [];
  if (body.visibility === 'shared') {
    const wanted = [...new Set(body.sharedWith)].filter((id) => id !== userId);
    shareIds = await usersRepository.existingIds(wanted);
    if (wanted.length === 0 || shareIds.length !== wanted.length) {
      throw invalid(['sharedWith'], 'Choisis des personnes existantes (autres que toi)');
    }
  }

  const isIdea = kind === 'idea';
  const fields = {
    title: body.title,
    description: body.description ?? null,
    instructions: isIdea ? null : (body.instructions ?? null),
    servings: body.servings,
    prepTimeMinutes: isIdea ? null : (body.prepTimeMinutes ?? null),
    cookTimeMinutes: isIdea ? null : (body.cookTimeMinutes ?? null),
    sourceUrl: body.sourceUrl ?? null,
    visibility: body.visibility,
    caloriesPerServingManual: body.caloriesPerServingManual ?? null,
    proteinsPerServingManual: body.proteinsPerServingManual ?? null,
  };
  return { fields, ingredients, tagIds, shareIds };
}

async function writeContent(recipeId, { ingredients, tagIds, shareIds }, transaction) {
  await recipesRepository.replaceIngredients(recipeId, ingredients, { transaction });
  await recipesRepository.replaceTags(recipeId, tagIds, { transaction });
  await recipesRepository.replaceShares(recipeId, shareIds, { transaction });
}

export async function create(userId, body) {
  const prepared = await prepare(userId, body.kind, body);
  // Photo de l'import : téléchargée avant d'écrire en base (un échec ne bloque pas la création)
  const photoPath = body.photoUrl ? await photos.storeFromUrl(body.photoUrl) : null;
  try {
    const recipe = await inTransaction(async (transaction) => {
      const created = await recipesRepository.create(
        { ...prepared.fields, kind: body.kind, ownerId: userId, photoPath },
        { transaction },
      );
      await writeContent(created.id, prepared, transaction);
      return created;
    });
    return get(userId, recipe.id);
  } catch (error) {
    await photos.removeFiles([photoPath]);
    throw error;
  }
}

export async function update(userId, id, body) {
  const recipe = await findOwned(userId, id);
  const prepared = await prepare(
    userId,
    recipe.kind,
    body,
    recipe.ingredients.map((i) => i.foodId).filter(Boolean),
  );
  await inTransaction(async (transaction) => {
    await recipesRepository.update(id, prepared.fields, { transaction });
    await writeContent(id, prepared, transaction);
  });
  return get(userId, id);
}

export async function remove(userId, id) {
  const recipe = await findOwned(userId, id);
  await recipesRepository.remove(id);
  await photos.removeFiles([recipe.photoPath]);
}

// ---------- Copie ----------

// Copie d'une recette visible (la sienne : « dupliquer »). Privée, à moi. Les aliments perso de l'autrice
// qu'elle utilise sont copiés chez moi et reliés ; la photo est copiée aussi.
export async function copy(userId, id) {
  const source = await findVisible(userId, id);
  const photoPath = await photos.duplicate(source.photoPath);
  try {
    const copied = await inTransaction(async (transaction) => {
      const copiedFoods = new Map();
      const ingredients = [];
      for (const ingredient of source.ingredients) {
        let foodId = ingredient.foodId;
        const food = ingredient.food;
        if (food && food.source === 'user' && food.ownerId !== userId) {
          if (!copiedFoods.has(food.id)) {
            const created = await foodsRepository.create(
              {
                source: 'user',
                ownerId: userId,
                name: food.name,
                searchName: food.searchName,
                brand: food.brand,
                category: food.category,
                energyKcal: food.energyKcal,
                proteinsG: food.proteinsG,
                carbsG: food.carbsG,
                fatsG: food.fatsG,
              },
              { transaction },
            );
            copiedFoods.set(food.id, created.id);
          }
          foodId = copiedFoods.get(food.id);
        }
        ingredients.push({
          label: ingredient.label,
          foodId,
          grams: ingredient.grams,
          isNegligible: ingredient.isNegligible,
        });
      }

      const created = await recipesRepository.create(
        {
          ownerId: userId,
          kind: source.kind,
          title: source.title,
          description: source.description,
          instructions: source.instructions,
          servings: source.servings,
          prepTimeMinutes: source.prepTimeMinutes,
          cookTimeMinutes: source.cookTimeMinutes,
          sourceUrl: source.sourceUrl,
          photoPath,
          visibility: 'private',
          caloriesPerServingManual: source.caloriesPerServingManual,
          proteinsPerServingManual: source.proteinsPerServingManual,
          copiedFromId: source.id,
        },
        { transaction },
      );
      await recipesRepository.replaceIngredients(created.id, ingredients, { transaction });
      await recipesRepository.replaceTags(
        created.id,
        source.tags.map((tag) => tag.id),
        { transaction },
      );
      return created;
    });
    return get(userId, copied.id);
  } catch (error) {
    await photos.removeFiles([photoPath]);
    throw error;
  }
}

// ---------- Photo ----------

export async function setPhoto(userId, id, buffer) {
  const recipe = await findOwned(userId, id);
  const key = await photos.storeUpload(buffer);
  try {
    await recipesRepository.update(id, { photoPath: key });
  } catch (error) {
    await photos.removeFiles([key]);
    throw error;
  }
  await photos.removeFiles([recipe.photoPath]);
  return { photoUrl: photoUrl(await recipesRepository.findFull(id)) };
}

export async function removePhoto(userId, id) {
  const recipe = await findOwned(userId, id);
  if (!recipe.photoPath) return;
  await recipesRepository.update(id, { photoPath: null });
  await photos.removeFiles([recipe.photoPath]);
}

// Envoie l'image si la personne a le droit de voir la recette (même règle que la lecture)
export async function sendPhoto(userId, id, res) {
  const recipe = await findVisible(userId, id);
  if (!recipe.photoPath) throw new HttpError(404, 'Cette recette n’a pas de photo');
  await photos.send(res, recipe.photoPath);
}

// ---------- Suppression d'un compte ----------

// Supprime un compte (via `deleteUser`) puis efface du disque les photos de ses recettes.
// Les chemins sont relevés avant : une fois le compte supprimé, la base ne les connaît plus.
// Si la suppression échoue, aucune photo n'est touchée.
export async function deletingPhotosOf(userId, deleteUser) {
  const paths = await recipesRepository.photoPathsOfUser(userId);
  await deleteUser();
  await photos.removeFiles(paths);
}
