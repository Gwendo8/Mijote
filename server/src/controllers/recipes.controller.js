import * as importService from '../services/recipe-import.service.js';
import * as recipesService from '../services/recipes.service.js';

export async function list(req, res) {
  res.json(await recipesService.list(req.user.id, req.validated.query));
}

export async function get(req, res) {
  res.json(await recipesService.get(req.user.id, req.validated.params.id));
}

export async function create(req, res) {
  res.status(201).json(await recipesService.create(req.user.id, req.validated.body));
}

export async function update(req, res) {
  res.json(await recipesService.update(req.user.id, req.validated.params.id, req.validated.body));
}

export async function remove(req, res) {
  await recipesService.remove(req.user.id, req.validated.params.id);
  res.status(204).end();
}

export async function copy(req, res) {
  res.status(201).json(await recipesService.copy(req.user.id, req.validated.params.id));
}

export async function importFromUrl(req, res) {
  res.json(await importService.importFromUrl(req.validated.body.url));
}

export async function setPhoto(req, res) {
  res.json(await recipesService.setPhoto(req.user.id, req.validated.params.id, req.file.buffer));
}

export async function removePhoto(req, res) {
  await recipesService.removePhoto(req.user.id, req.validated.params.id);
  res.status(204).end();
}

export async function getPhoto(req, res) {
  await recipesService.sendPhoto(req.user.id, req.validated.params.id, res);
}
