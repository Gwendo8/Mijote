import * as adminUsersService from '../services/admin-users.service.js';

export async function list(req, res) {
  res.json(await adminUsersService.list(req.validated.query));
}

export async function setRole(req, res) {
  res.json(await adminUsersService.setRole(req.validated.params.id, req.validated.body.role));
}

export async function remove(req, res) {
  await adminUsersService.remove(req.user.id, req.validated.params.id);
  res.status(204).end();
}

export async function sendResetLink(req, res) {
  await adminUsersService.sendResetLink(req.user.id, req.validated.params.id);
  res.status(204).end();
}
