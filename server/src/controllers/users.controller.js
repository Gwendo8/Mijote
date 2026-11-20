import * as usersService from '../services/users.service.js';

export async function search(req, res) {
  res.json(await usersService.search(req.user.id, req.validated.query.q));
}
