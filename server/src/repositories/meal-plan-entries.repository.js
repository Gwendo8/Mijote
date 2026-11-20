import { Op } from 'sequelize';
import { MealPlanEntry } from '../models/index.js';

// Seul endroit qui lit et écrit les entrées du planning.
const order = [
  ['date', 'ASC'],
  ['position', 'ASC'],
  ['id', 'ASC'],
];

// Les entrées d'une personne entre deux jours (inclus)
export const listBetween = (userId, from, to) =>
  MealPlanEntry.findAll({ where: { userId, date: { [Op.between]: [from, to] } }, order });

// Une entrée, seulement si elle est à cette personne
export const findOwned = (userId, id, options = {}) =>
  MealPlanEntry.findOne({ where: { id, userId }, ...options });

// Le contenu d'une case (un jour, un créneau), dans l'ordre
export const listCell = (userId, date, mealSlotId, options = {}) =>
  MealPlanEntry.findAll({
    where: { userId, date, mealSlotId },
    order: [
      ['position', 'ASC'],
      ['id', 'ASC'],
    ],
    ...options,
  });

export async function nextPosition(userId, date, mealSlotId, options = {}) {
  const last = await MealPlanEntry.max('position', {
    where: { userId, date, mealSlotId },
    ...options,
  });
  return last === null || last === undefined ? 0 : Number(last) + 1;
}

export const create = (data, options = {}) => MealPlanEntry.create(data, options);

export const update = (entry, data, options = {}) => entry.update(data, options);

export const remove = (entry, options = {}) => entry.destroy(options);

// Dernières valeurs connues : mises à jour sans toucher à la date de modification de l'entrée
export const updateLastKnown = (id, data) =>
  MealPlanEntry.update(data, { where: { id }, silent: true });
