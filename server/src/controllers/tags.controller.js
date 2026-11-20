import * as tagsService from '../services/tags.service.js';

export async function list(req, res) {
  res.json(await tagsService.list());
}

export async function create(req, res) {
  res.status(201).json(await tagsService.create(req.validated.body));
}

export async function update(req, res) {
  res.json(await tagsService.update(req.validated.params.id, req.validated.body));
}

export async function remove(req, res) {
  await tagsService.remove(req.validated.params.id);
  res.status(204).end();
}
