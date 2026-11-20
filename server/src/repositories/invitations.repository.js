import { Invitation } from '../models/index.js';

export const findByTokenHash = (tokenHash) => Invitation.findOne({ where: { tokenHash } });

export const markAccepted = (id, options = {}) =>
  Invitation.update({ acceptedAt: new Date() }, { where: { id }, ...options });
