import { Op } from 'sequelize';
import { Session, User } from '../models/index.js';

export const create = (data) => Session.create(data);

// Session + compte (sans le mot de passe) à partir de l'empreinte du cookie
export const findWithUser = (tokenHash) =>
  Session.findOne({
    where: { tokenHash },
    include: [{ model: User, as: 'user', attributes: { exclude: ['passwordHash'] } }],
  });

export const touch = (id, data) => Session.update(data, { where: { id } });
export const removeById = (id) => Session.destroy({ where: { id } });
export const removeAllOfUser = (userId, options = {}) =>
  Session.destroy({ where: { userId }, ...options });
export const removeOthersOfUser = (userId, keepId, options = {}) =>
  Session.destroy({ where: { userId, id: { [Op.ne]: keepId } }, ...options });
