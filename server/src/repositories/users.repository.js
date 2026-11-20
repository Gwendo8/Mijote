import { col, fn, Op } from 'sequelize';
import { Recipe, User } from '../models/index.js';
import { contains, words } from '../utils/search.js';

// Seul endroit qui lit et écrit les comptes. passwordHash est exclu par défaut : il ne sort que par
// les fonctions « WithPassword », réservées aux vérifications de mot de passe.
const PUBLIC = { exclude: ['passwordHash'] };

export const findById = (id, options = {}) => User.findByPk(id, { attributes: PUBLIC, ...options });
export const findByIdWithPassword = (id) => User.findByPk(id);
export const findByEmail = (email) => User.findOne({ where: { email }, attributes: PUBLIC });
export const findByEmailWithPassword = (email) => User.findOne({ where: { email } });

export const create = (data, options = {}) => User.create(data, options);

export async function update(id, data, options = {}) {
  await User.update(data, { where: { id }, ...options });
  return findById(id, options);
}

export const remove = (id) => User.destroy({ where: { id } });
export const countAdmins = () => User.count({ where: { role: 'admin' } });
export const countOtherAdmins = (id) =>
  User.count({ where: { role: 'admin', id: { [Op.ne]: id } } });

// Liste des comptes pour l'admin : recherche sur le prénom, le nom ou l'e-mail, sans accents ni majuscules.
export async function list({ q, offset, limit }) {
  const conditions = words(q ?? '').map((word) => ({
    [Op.or]: [contains('first_name', word), contains('last_name', word), contains('email', word)],
  }));
  const { rows, count } = await User.findAndCountAll({
    where: { [Op.and]: conditions },
    attributes: PUBLIC,
    order: [
      [fn('lower', col('last_name')), 'ASC'],
      [fn('lower', col('first_name')), 'ASC'],
      ['id', 'ASC'],
    ],
    offset,
    limit,
  });
  return { rows, total: count };
}

// Nombre de recettes (kind = recipe) de chaque compte donné : { [userId]: nombre }
export async function recipeCounts(userIds) {
  if (userIds.length === 0) return {};
  const rows = await Recipe.findAll({
    where: { ownerId: userIds, kind: 'recipe' },
    attributes: ['ownerId', [fn('count', col('id')), 'count']],
    group: ['ownerId'],
    raw: true,
  });
  return Object.fromEntries(rows.map((row) => [row.ownerId, Number(row.count)]));
}

// Recherche par nom pour le partage : jamais soi-même, 10 résultats au plus, pas d'e-mail
export const searchByName = (q, excludeId, limit = 10) =>
  User.findAll({
    where: {
      [Op.and]: [
        { id: { [Op.ne]: excludeId } },
        // chaque mot cherché doit se trouver dans le prénom ou dans le nom (« camille du » marche)
        ...words(q).map((w) => ({
          [Op.or]: [contains('first_name', w), contains('last_name', w)],
        })),
      ],
    },
    attributes: ['id', 'firstName', 'lastName'],
    order: [
      [fn('lower', col('last_name')), 'ASC'],
      [fn('lower', col('first_name')), 'ASC'],
      ['id', 'ASC'],
    ],
    limit,
  });

// Identifiants des comptes qui existent parmi ceux donnés
export const existingIds = async (ids) =>
  (await User.findAll({ where: { id: ids }, attributes: ['id'] })).map((user) => user.id);
