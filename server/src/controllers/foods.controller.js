import * as foodsService from '../services/foods.service.js';

export async function search(req, res) {
  res.json(await foodsService.search(req.user.id, req.validated.query));
}

export async function listMine(req, res) {
  res.json(await foodsService.listMine(req.user.id, req.validated.query));
}

export async function get(req, res) {
  res.json(await foodsService.get(req.user.id, req.validated.params.id));
}

export async function getByBarcode(req, res) {
  res.json(await foodsService.getByBarcode(req.user.id, req.validated.params.code));
}

export async function searchOff(req, res) {
  res.json(await foodsService.searchOff(req.user.id, req.validated.query));
}

export async function create(req, res) {
  res.status(201).json(await foodsService.create(req.user.id, req.validated.body));
}

export async function update(req, res) {
  res.json(await foodsService.update(req.user.id, req.validated.params.id, req.validated.body));
}

export async function remove(req, res) {
  res.json(await foodsService.remove(req.user.id, req.validated.params.id));
}

// Corrections de l'admin
export async function listCorrections(req, res) {
  res.json(await foodsService.listCorrections(req.user.id, req.validated.query));
}

export async function correct(req, res) {
  res.json(await foodsService.correct(req.user.id, req.validated.params.id, req.validated.body));
}

export async function removeCorrection(req, res) {
  await foodsService.removeCorrection(req.validated.params.id);
  res.status(204).end();
}
