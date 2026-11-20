import * as invitationsService from '../services/invitations.service.js';

export async function list(req, res) {
  res.json(await invitationsService.list());
}

export async function invite(req, res) {
  res.status(201).json(await invitationsService.invite(req.user.id, req.validated.body.email));
}

export async function cancel(req, res) {
  await invitationsService.cancel(req.validated.params.id);
  res.status(204).end();
}
