import { MealSlot } from '../models/index.js';
import { DEFAULT_MEAL_SLOTS } from '../models/MealSlot.js';

// Seul endroit qui lit et écrit les créneaux de repas.

// Les 4 créneaux par défaut d'un nouveau compte
export const createDefaults = (userId, options = {}) =>
  MealSlot.bulkCreate(
    DEFAULT_MEAL_SLOTS.map((name, position) => ({ userId, name, position, isDefault: true })),
    options,
  );

// Tous les créneaux d'une personne, masqués compris, dans l'ordre
export const listOfUser = (userId, options = {}) =>
  MealSlot.findAll({
    where: { userId },
    order: [
      ['position', 'ASC'],
      ['id', 'ASC'],
    ],
    ...options,
  });

// Un créneau, seulement s'il est à cette personne
export const findOwned = (userId, id, options = {}) =>
  MealSlot.findOne({ where: { id, userId }, ...options });

export const create = (data, options = {}) => MealSlot.create(data, options);

export const update = (slot, data, options = {}) => slot.update(data, options);

export const remove = (slot, options = {}) => slot.destroy(options);
