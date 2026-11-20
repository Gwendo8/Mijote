import { literal, Op } from 'sequelize';
import {
  Food,
  FoodCorrection,
  Recipe,
  RecipeIngredient,
  RecipeShare,
  RecipeTag,
  sequelize,
  Tag,
  User,
} from '../models/index.js';
import { escapeLike, words } from '../utils/search.js';

// Seul endroit qui lit et écrit les recettes, leurs ingrédients, étiquettes et partages.
const detailInclude = [
  { model: User, as: 'owner', attributes: ['id', 'firstName', 'lastName'] },
  { model: Tag, as: 'tags', attributes: ['id', 'name', 'position'], through: { attributes: [] } },
  {
    model: RecipeShare,
    as: 'shares',
    include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName'] }],
  },
  { model: Recipe, as: 'copiedFrom', attributes: ['id', 'title', 'ownerId', 'visibility'] },
  {
    model: RecipeIngredient,
    as: 'ingredients',
    include: [
      {
        model: Food,
        as: 'food',
        include: [{ model: FoodCorrection, as: 'correction', required: false }],
      },
    ],
  },
];

const detailOrder = [
  [{ model: RecipeIngredient, as: 'ingredients' }, 'position', 'ASC'],
  [{ model: Tag, as: 'tags' }, 'position', 'ASC'],
  [{ model: Tag, as: 'tags' }, 'id', 'ASC'],
];

export const findFull = (id) => Recipe.findByPk(id, { include: detailInclude, order: detailOrder });

// Plusieurs recettes dans l'ordre des identifiants donnés
export async function findManyFull(ids) {
  if (ids.length === 0) return [];
  const rows = await Recipe.findAll({
    where: { id: ids },
    include: detailInclude,
    order: detailOrder,
  });
  const byId = new Map(rows.map((row) => [row.id, row]));
  return ids.map((id) => byId.get(id)).filter(Boolean);
}

const sharedWithMe = (userId) =>
  literal(`(SELECT recipe_id FROM recipe_shares WHERE user_id = ${Number(userId)})`);

// Ce que cette personne a le droit de voir : ses recettes, les publiques, celles partagées avec elle
const visibleTo = (userId) => ({
  [Op.or]: [
    { ownerId: userId },
    { visibility: 'public' },
    { visibility: 'shared', id: { [Op.in]: sharedWithMe(userId) } },
  ],
});

const scopeCondition = (scope, userId) => {
  if (scope === 'mine') return { ownerId: userId };
  if (scope === 'shared') {
    return {
      ownerId: { [Op.ne]: userId },
      visibility: 'shared',
      id: { [Op.in]: sharedWithMe(userId) },
    };
  }
  if (scope === 'public') return { ownerId: { [Op.ne]: userId }, visibility: 'public' };
  return visibleTo(userId);
};

// « Le mot est dans le titre ou dans le texte d'un ingrédient », sans accents ni majuscules
function wordCondition(word) {
  const pattern = sequelize.escape(`%${escapeLike(word)}%`);
  return literal(
    `(unaccent(lower("Recipe"."title")) LIKE unaccent(lower(${pattern})) OR EXISTS (
      SELECT 1 FROM recipe_ingredients ri
      WHERE ri.recipe_id = "Recipe"."id" AND unaccent(lower(ri.label)) LIKE unaccent(lower(${pattern}))))`,
  );
}

// La recette doit avoir TOUTES les étiquettes données
const tagsCondition = (tagIds) =>
  literal(
    `"Recipe"."id" IN (SELECT recipe_id FROM recipe_tags WHERE tag_id IN (${tagIds
      .map(Number)
      .join(',')}) GROUP BY recipe_id HAVING COUNT(DISTINCT tag_id) = ${new Set(tagIds).size})`,
  );

// Recherche : renvoie les identifiants des recettes visibles qui correspondent aux filtres.
// Avec `offset` et `limit`, trie et découpe en base (tri sur titre ou date) ; sans, renvoie tout
// (le service trie alors sur les calories ou les protéines, calculées à la lecture).
export async function search({
  userId,
  scope,
  kind,
  q,
  tagIds,
  ownerId,
  sort,
  order,
  offset,
  limit,
}) {
  const conditions = [scopeCondition(scope, userId)];
  if (kind) conditions.push({ kind });
  if (ownerId) conditions.push({ ownerId });
  if (tagIds?.length) conditions.push(tagsCondition(tagIds));
  for (const word of words(q ?? '')) conditions.push(wordCondition(word));

  const direction = order.toUpperCase();
  const orderBy =
    sort === 'title'
      ? [
          [literal('unaccent(lower("Recipe"."title"))'), direction],
          ['id', 'ASC'],
        ]
      : [
          ['createdAt', direction],
          ['id', direction],
        ];

  const { rows, count } = await Recipe.findAndCountAll({
    where: { [Op.and]: conditions },
    attributes: ['id'],
    order: orderBy,
    ...(limit && { offset, limit }),
  });
  return { ids: rows.map((row) => row.id), total: count };
}

export const create = (data, options = {}) => Recipe.create(data, options);
export const update = (id, data, options = {}) =>
  Recipe.update(data, { where: { id }, ...options });
export const remove = (id) => Recipe.destroy({ where: { id } });

export async function replaceIngredients(recipeId, ingredients, options = {}) {
  await RecipeIngredient.destroy({ where: { recipeId }, ...options });
  await RecipeIngredient.bulkCreate(
    ingredients.map((ingredient, position) => ({ ...ingredient, recipeId, position })),
    options,
  );
}

export async function replaceTags(recipeId, tagIds, options = {}) {
  await RecipeTag.destroy({ where: { recipeId }, ...options });
  await RecipeTag.bulkCreate(
    [...new Set(tagIds)].map((tagId) => ({ recipeId, tagId })),
    options,
  );
}

export async function replaceShares(recipeId, userIds, options = {}) {
  await RecipeShare.destroy({ where: { recipeId }, ...options });
  await RecipeShare.bulkCreate(
    [...new Set(userIds)].map((userId) => ({ recipeId, userId })),
    options,
  );
}

// Chemins des photos de toutes les recettes d'une personne (à effacer du disque avant la suppression du compte)
export async function photoPathsOfUser(userId) {
  const rows = await Recipe.findAll({
    where: { ownerId: userId, photoPath: { [Op.ne]: null } },
    attributes: ['photoPath'],
  });
  return rows.map((row) => row.photoPath);
}

// Identifiants des aliments déjà utilisés par une recette
export async function foodIdsOf(recipeId) {
  const rows = await RecipeIngredient.findAll({ where: { recipeId }, attributes: ['foodId'] });
  return rows.map((row) => row.foodId).filter(Boolean);
}

// Cette personne peut-elle voir cette recette ?
export const isVisibleTo = async (id, userId) =>
  (await Recipe.count({ where: { [Op.and]: [{ id }, visibleTo(userId)] } })) > 0;
