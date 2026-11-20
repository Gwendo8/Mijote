import * as foodsRepository from '../repositories/foods.repository.js';
import { inTransaction } from '../repositories/transactions.js';
import { fetchProduct, searchProducts } from '../integrations/openfoodfacts.js';
import { HttpError } from '../utils/HttpError.js';
import { offsetOf, paginated } from '../utils/pagination.js';
import { normalizeSearchText } from '../utils/text.js';

const OFF_CACHE_MS = 90 * 24 * 60 * 60 * 1000; // un produit gardé plus de 90 jours est rafraîchi

// Les décimales de la base arrivent en texte : on renvoie des nombres, arrondis à 1 décimale.
const num = (value) =>
  value === null || value === undefined ? null : Math.round(Number(value) * 10) / 10;

// Aliment tel que le renvoie l'API : valeurs effectives (la correction de l'admin si elle existe),
// la valeur d'origine reste visible dans `original`.
export function toFood(food, userId) {
  const correction = food.correction ?? null;
  const pick = (field) => correction?.[field] ?? food[field];
  const result = {
    id: food.id,
    source: food.source,
    name: pick('name'),
    brand: food.brand,
    category: food.category,
    barcode: food.barcode,
    energyKcal: num(pick('energyKcal')),
    proteinsG: num(pick('proteinsG')),
    carbsG: num(pick('carbsG')),
    fatsG: num(pick('fatsG')),
    isCorrected: Boolean(correction),
    isMine: food.source === 'user' && food.ownerId === userId,
    archivedAt: food.archivedAt,
  };
  if (correction) {
    result.original = {
      name: food.name,
      energyKcal: num(food.energyKcal),
      proteinsG: num(food.proteinsG),
      carbsG: num(food.carbsG),
      fatsG: num(food.fatsG),
    };
    result.correctionNote = correction.note;
  }
  return result;
}

const toList = ({ rows, total }, query, userId) =>
  paginated(
    rows.map((row) => toFood(row, userId)),
    total,
    query,
  );

export async function search(userId, query) {
  const result = await foodsRepository.search({
    q: query.q,
    source: query.source,
    userId,
    offset: offsetOf(query),
    limit: query.limit,
  });
  return toList(result, query, userId);
}

export async function listMine(userId, query) {
  const result = await foodsRepository.listMine(userId, {
    offset: offsetOf(query),
    limit: query.limit,
  });
  return toList(result, query, userId);
}

// Un aliment perso d'une autre personne ne se lit que si une recette que je vois l'utilise
async function readableOrNull(food, userId) {
  if (!food) return null;
  if (food.source !== 'user' || food.ownerId === userId) return food;
  return (await foodsRepository.isUsedInRecipeVisibleTo(food.id, userId)) ? food : null;
}

export async function get(userId, id) {
  const food = await readableOrNull(await foodsRepository.findById(id), userId);
  if (!food) throw new HttpError(404, 'Aliment introuvable');
  return toFood(food, userId);
}

// ---------- Aliments perso ----------

export async function create(userId, data) {
  const food = await foodsRepository.create({
    ...data,
    source: 'user',
    ownerId: userId,
    searchName: normalizeSearchText(data.name),
  });
  return get(userId, food.id);
}

// Aliment perso modifiable par cette personne : 404 si introuvable ou archivé, 403 si ce n'est pas le sien
async function findOwned(userId, id) {
  const food = await foodsRepository.findById(id);
  if (!food || food.archivedAt) throw new HttpError(404, 'Aliment introuvable');
  if (food.source === 'user' && food.ownerId === userId) return food;
  if (!(await readableOrNull(food, userId))) throw new HttpError(404, 'Aliment introuvable');
  throw new HttpError(403, 'Tu ne peux modifier que tes propres aliments');
}

export async function update(userId, id, data) {
  await findOwned(userId, id);
  const changes = { ...data };
  if (data.name !== undefined) changes.searchName = normalizeSearchText(data.name);
  await foodsRepository.update(id, changes);
  return get(userId, id);
}

// Jamais utilisé dans une recette : supprimé pour de vrai. Utilisé : archivé (il disparaît de la liste et des
// recherches, mais les recettes qui l'utilisent gardent leurs calories).
export async function remove(userId, id) {
  await findOwned(userId, id);
  if (await foodsRepository.isUsedInRecipes(id)) {
    await foodsRepository.archive(id);
    return { result: 'archived' };
  }
  await foodsRepository.remove(id);
  return { result: 'deleted' };
}

// ---------- Open Food Facts ----------

// Garde les produits reçus en base, puis les relit avec leur éventuelle correction
async function cacheProducts(userId, products) {
  const ids = await inTransaction(async () => {
    const saved = [];
    for (const product of products) saved.push(await foodsRepository.saveOffProduct(product));
    return saved;
  });
  return Promise.all(ids.map((id) => get(userId, id)));
}

export async function getByBarcode(userId, code) {
  const cached = await foodsRepository.findOffByBarcode(code);
  const fresh = cached?.fetchedAt && Date.now() - cached.fetchedAt.getTime() < OFF_CACHE_MS;
  if (fresh) return toFood(cached, userId);

  let product;
  try {
    product = await fetchProduct(code);
  } catch (error) {
    // Open Food Facts ne répond pas : on se contente de la version gardée, même ancienne
    if (cached && error.status === 502) return toFood(cached, userId);
    throw error;
  }
  if (!product) {
    if (cached) return toFood(cached, userId);
    throw new HttpError(404, 'Produit introuvable : ajoute-le à la main');
  }
  const [food] = await cacheProducts(userId, [product]);
  return food;
}

export async function searchOff(userId, { q }) {
  const items = await cacheProducts(userId, await searchProducts(q));
  return { items, total: items.length };
}

// ---------- Corrections de l'admin ----------

export async function listCorrections(adminId, query) {
  const result = await foodsRepository.listCorrected({
    offset: offsetOf(query),
    limit: query.limit,
  });
  return toList(result, query, adminId);
}

async function findCommon(id) {
  const food = await foodsRepository.findById(id);
  if (!food) throw new HttpError(404, 'Aliment introuvable');
  if (food.source === 'user') {
    throw new HttpError(400, 'Seuls les aliments communs peuvent être corrigés');
  }
  return food;
}

export async function correct(adminId, id, { name, energyKcal, proteinsG, carbsG, fatsG, note }) {
  await findCommon(id);
  await foodsRepository.saveCorrection(id, {
    name: name ?? null,
    energyKcal: energyKcal ?? null,
    proteinsG: proteinsG ?? null,
    carbsG: carbsG ?? null,
    fatsG: fatsG ?? null,
    note: note ?? null,
    correctedById: adminId,
  });
  return get(adminId, id);
}

export async function removeCorrection(id) {
  await findCommon(id);
  await foodsRepository.removeCorrection(id);
}
