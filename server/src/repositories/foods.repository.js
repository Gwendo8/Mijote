import { literal, Op } from 'sequelize';
import { Food, FoodCorrection, Recipe, RecipeIngredient, sequelize } from '../models/index.js';
import { contains, escapeLike, words } from '../utils/search.js';

// Seul endroit qui lit et écrit les aliments et leurs corrections.
// Chaque lecture ramène aussi la correction de l'admin (`correction`), le service en tire les valeurs effectives.
const withCorrection = { model: FoodCorrection, as: 'correction', required: false };

export const findById = (id) => Food.findByPk(id, { include: [withCorrection] });

export const findOffByBarcode = (barcode) =>
  Food.findOne({ where: { source: 'off', barcode }, include: [withCorrection] });

// Recherche par mots : tous doivent se trouver dans le nom (d'origine ou corrigé) ou la marque.
// Exclut les aliments archivés ; les aliments perso des autres ne sont jamais renvoyés.
export async function search({ q, source, userId, offset, limit }) {
  const sourceCondition = source
    ? source === 'user'
      ? { source: 'user', ownerId: userId }
      : { source }
    : {
        [Op.or]: [{ source: { [Op.in]: ['ciqual', 'off'] } }, { source: 'user', ownerId: userId }],
      };

  const wordConditions = words(q).map((word) => ({
    [Op.or]: [
      contains('Food.name', word),
      contains('correction.name', word),
      contains('Food.brand', word),
    ],
  }));

  // Nom qui commence par la recherche d'abord, puis Ciqual avant mes aliments avant Open Food Facts, puis nom court
  const startsWith = literal(
    `CASE WHEN unaccent(lower("Food"."name")) LIKE unaccent(lower(${sequelize.escape(`${escapeLike(q.trim())}%`)})) THEN 0 ELSE 1 END`,
  );
  const sourceRank = literal(
    `CASE "Food"."source" WHEN 'ciqual' THEN 0 WHEN 'user' THEN 1 ELSE 2 END`,
  );

  const { rows, count } = await Food.findAndCountAll({
    where: { [Op.and]: [{ archivedAt: null }, sourceCondition, ...wordConditions] },
    include: [withCorrection],
    order: [
      [startsWith, 'ASC'],
      [sourceRank, 'ASC'],
      [literal('length("Food"."name")'), 'ASC'],
      ['name', 'ASC'],
      ['id', 'ASC'],
    ],
    offset,
    limit,
  });
  return { rows, total: count };
}

export async function listMine(userId, { offset, limit }) {
  const { rows, count } = await Food.findAndCountAll({
    where: { source: 'user', ownerId: userId, archivedAt: null },
    include: [withCorrection],
    order: [
      ['createdAt', 'DESC'],
      ['id', 'DESC'],
    ],
    offset,
    limit,
  });
  return { rows, total: count };
}

export const create = (data, options = {}) => Food.create(data, options);

export const findManyByIds = (ids) =>
  Food.findAll({ where: { id: ids }, include: [withCorrection] });

export async function update(id, data) {
  await Food.update(data, { where: { id } });
  return findById(id);
}

export const remove = (id) => Food.destroy({ where: { id } });
export const archive = (id) => Food.update({ archivedAt: new Date() }, { where: { id } });

// Cet aliment est-il l'ingrédient d'au moins une recette (de n'importe qui) ?
export const isUsedInRecipes = async (foodId) =>
  Boolean(await RecipeIngredient.findOne({ where: { foodId }, attributes: ['id'] }));

// Une recette que cette personne peut voir (la sienne, publique, ou partagée avec elle) utilise-t-elle cet aliment ?
export async function isUsedInRecipeVisibleTo(foodId, userId) {
  const sharedWithMe = literal(
    `(SELECT recipe_id FROM recipe_shares WHERE user_id = ${Number(userId)})`,
  );
  return Boolean(
    await RecipeIngredient.findOne({
      where: { foodId },
      attributes: ['id'],
      include: [
        {
          model: Recipe,
          as: 'recipe',
          required: true,
          attributes: ['id'],
          where: {
            [Op.or]: [
              { ownerId: userId },
              { visibility: 'public' },
              { visibility: 'shared', id: { [Op.in]: sharedWithMe } },
            ],
          },
        },
      ],
    }),
  );
}

// Garde un produit Open Food Facts en cache : le crée, ou met à jour ses valeurs d'origine (jamais la correction).
export async function saveOffProduct(data, { transaction } = {}) {
  const existing = await Food.findOne({
    where: { source: 'off', barcode: data.barcode },
    transaction,
  });
  if (existing) {
    await existing.update(data, { transaction });
    return existing.id;
  }
  return (await Food.create({ ...data, source: 'off' }, { transaction })).id;
}

// ---------- Corrections de l'admin ----------

export async function listCorrected({ offset, limit }) {
  const { rows, count } = await Food.findAndCountAll({
    include: [{ ...withCorrection, required: true }],
    order: [
      [{ model: FoodCorrection, as: 'correction' }, 'updatedAt', 'DESC'],
      ['id', 'ASC'],
    ],
    offset,
    limit,
  });
  return { rows, total: count };
}

export async function saveCorrection(foodId, data) {
  await FoodCorrection.upsert({ foodId, ...data });
}

export const removeCorrection = (foodId) => FoodCorrection.destroy({ where: { foodId } });

// ---------- Import Ciqual ----------

export const findAllCiqual = () => Food.findAll({ where: { source: 'ciqual' } });
export const createMany = (rows, options = {}) => Food.bulkCreate(rows, options);
export const updateById = (id, data, options = {}) =>
  Food.update(data, { where: { id }, ...options });
export const archiveMany = (ids, options = {}) =>
  Food.update({ archivedAt: new Date() }, { where: { id: ids }, ...options });
