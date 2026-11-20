import { MealSlot } from '../models/index.js';
import { DEFAULT_MEAL_SLOTS } from '../models/MealSlot.js';

// Les 4 créneaux par défaut d'un nouveau compte
export const createDefaults = (userId, options = {}) =>
  MealSlot.bulkCreate(
    DEFAULT_MEAL_SLOTS.map((name, position) => ({ userId, name, position, isDefault: true })),
    options,
  );
