import { PasswordResetToken } from '../models/index.js';

export const create = (data) => PasswordResetToken.create(data);
export const findByTokenHash = (tokenHash) => PasswordResetToken.findOne({ where: { tokenHash } });
export const markUsed = (id, options = {}) =>
  PasswordResetToken.update({ usedAt: new Date() }, { where: { id }, ...options });
// Les anciens liens d'une personne cessent de marcher quand un nouveau est créé ou utilisé
export const removeAllOfUser = (userId, options = {}) =>
  PasswordResetToken.destroy({ where: { userId }, ...options });
