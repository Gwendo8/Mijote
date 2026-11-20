import * as mealSlotsRepository from '../repositories/meal-slots.repository.js';
import { inTransaction } from '../repositories/transactions.js';
import { HttpError } from '../utils/HttpError.js';
import { insertAt } from '../utils/positions.js';
import { normalizeSearchText } from '../utils/text.js';

export const toSlot = (slot) => ({
  id: slot.id,
  name: slot.name,
  position: slot.position,
  isDefault: slot.isDefault,
  isHidden: slot.isHidden,
});

const duplicate = () => new HttpError(409, 'Ce créneau existe déjà');

// Un nom déjà pris (sans tenir compte des majuscules ni des accents) donne 409
const isTaken = (slots, name, exceptId) =>
  slots.some(
    (slot) => slot.id !== exceptId && normalizeSearchText(slot.name) === normalizeSearchText(name),
  );

export async function list(userId) {
  return (await mealSlotsRepository.listOfUser(userId)).map(toSlot);
}

export async function create(userId, { name }) {
  return inTransaction(async (transaction) => {
    const slots = await mealSlotsRepository.listOfUser(userId, { transaction });
    if (isTaken(slots, name)) throw duplicate();
    const position = slots.reduce((max, slot) => Math.max(max, slot.position + 1), 0);
    const slot = await mealSlotsRepository.create(
      { userId, name, position, isDefault: false },
      { transaction },
    );
    return toSlot(slot);
  });
}

export async function update(userId, id, body) {
  return inTransaction(async (transaction) => {
    const slots = await mealSlotsRepository.listOfUser(userId, { transaction });
    const slot = slots.find((item) => item.id === id);
    if (!slot) throw new HttpError(404, 'Créneau introuvable');
    if (body.name !== undefined && isTaken(slots, body.name, id)) throw duplicate();

    const fields = {};
    if (body.name !== undefined) fields.name = body.name;
    if (body.isHidden !== undefined) fields.isHidden = body.isHidden;
    if (Object.keys(fields).length > 0) {
      await mealSlotsRepository.update(slot, fields, { transaction });
    }

    // Réordonner : les positions de tous les créneaux sont renumérotées de 0 à n
    if (body.position !== undefined) {
      const others = slots.filter((item) => item.id !== id);
      const ordered = insertAt(others, slot, body.position);
      for (const [position, item] of ordered.entries()) {
        if (item.position !== position) {
          await mealSlotsRepository.update(item, { position }, { transaction });
        }
      }
    }
    return toSlot(slot);
  });
}

export async function remove(userId, id) {
  const slot = await mealSlotsRepository.findOwned(userId, id);
  if (!slot) throw new HttpError(404, 'Créneau introuvable');
  if (slot.isDefault) {
    throw new HttpError(400, 'Les créneaux par défaut se masquent, ils ne se suppriment pas');
  }
  // La base supprime aussi les entrées du créneau (suppression en cascade)
  await mealSlotsRepository.remove(slot);
}
