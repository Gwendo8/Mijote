import { clearSessionCookie, setSessionCookie } from '../middlewares/auth.js';
import * as authService from '../services/auth.service.js';
import { endSession } from '../services/session.service.js';

export async function login(req, res) {
  const { user, token } = await authService.login(req.validated.body);
  setSessionCookie(res, token);
  res.json(user);
}

export async function register(req, res) {
  const { user, token } = await authService.register(req.validated.body);
  setSessionCookie(res, token);
  res.status(201).json(user);
}

export async function getInvitation(req, res) {
  res.json(await authService.getInvitation(req.validated.params.token));
}

export async function forgotPassword(req, res) {
  await authService.forgotPassword(req.validated.body);
  res.status(204).end();
}

export async function resetPassword(req, res) {
  await authService.resetPassword(req.validated.body);
  res.status(204).end();
}

export function me(req, res) {
  res.json(authService.toPublicUser(req.user));
}

export async function logout(req, res) {
  await endSession(req.sessionId);
  clearSessionCookie(res);
  res.status(204).end();
}

export async function logoutAll(req, res) {
  await authService.logoutAll(req.user.id);
  clearSessionCookie(res);
  res.status(204).end();
}
