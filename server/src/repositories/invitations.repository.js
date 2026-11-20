import { Op } from 'sequelize';
import { Invitation, User } from '../models/index.js';

export const findByTokenHash = (tokenHash) => Invitation.findOne({ where: { tokenHash } });

export const markAccepted = (id, options = {}) =>
  Invitation.update({ acceptedAt: new Date() }, { where: { id }, ...options });

// Invitations en attente (ni acceptées, ni expirées), les plus récentes d'abord
export const listPending = () =>
  Invitation.findAll({
    where: { acceptedAt: null, expiresAt: { [Op.gt]: new Date() } },
    include: [{ model: User, as: 'invitedBy', attributes: ['id', 'displayName'] }],
    order: [['createdAt', 'DESC']],
  });

export const findPendingByEmail = (email, options = {}) =>
  Invitation.findOne({ where: { email, acceptedAt: null }, ...options });

export const create = (data, options = {}) => Invitation.create(data, options);

export const findPendingById = (id) => Invitation.findOne({ where: { id, acceptedAt: null } });

export const findWithInviter = (id, options = {}) =>
  Invitation.findByPk(id, {
    include: [{ model: User, as: 'invitedBy', attributes: ['id', 'displayName'] }],
    ...options,
  });

export const remove = (id) => Invitation.destroy({ where: { id } });
