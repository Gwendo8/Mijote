import { clearSessionCookie } from '../middlewares/auth.js';
import * as meService from '../services/me.service.js';

export async function update(req, res) {
  res.json(await meService.updateProfile(req.user.id, req.validated.body));
}

export async function changePassword(req, res) {
  await meService.changePassword(req.user.id, req.sessionId, req.validated.body);
  res.status(204).end();
}

export async function remove(req, res) {
  await meService.deleteAccount(req.user, req.validated.body);
  clearSessionCookie(res);
  res.status(204).end();
}
