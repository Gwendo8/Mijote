import * as mealSlotsService from '../services/meal-slots.service.js';
import * as sharesService from '../services/planning-shares.service.js';
import * as planningService from '../services/planning.service.js';

// Semaine
export async function week(req, res) {
  res.json(await planningService.getWeek(req.user.id, req.validated.query));
}

// Entrées
export async function addEntry(req, res) {
  res.status(201).json(await planningService.addEntry(req.user.id, req.validated.body));
}

export async function updateEntry(req, res) {
  res.json(
    await planningService.updateEntry(req.user.id, req.validated.params.id, req.validated.body),
  );
}

export async function removeEntry(req, res) {
  await planningService.removeEntry(req.user.id, req.validated.params.id);
  res.status(204).end();
}

// Créneaux
export async function listSlots(req, res) {
  res.json(await mealSlotsService.list(req.user.id));
}

export async function createSlot(req, res) {
  res.status(201).json(await mealSlotsService.create(req.user.id, req.validated.body));
}

export async function updateSlot(req, res) {
  res.json(await mealSlotsService.update(req.user.id, req.validated.params.id, req.validated.body));
}

export async function removeSlot(req, res) {
  await mealSlotsService.remove(req.user.id, req.validated.params.id);
  res.status(204).end();
}

// Partages
export async function listShares(req, res) {
  res.json(await sharesService.list(req.user.id));
}

export async function createShare(req, res) {
  res.status(201).json(await sharesService.create(req.user.id, req.validated.body));
}

export async function removeShare(req, res) {
  await sharesService.remove(req.user.id, req.validated.params.id);
  res.status(204).end();
}

export async function sharedWithMe(req, res) {
  res.json(await sharesService.sharedWithMe(req.user.id));
}
