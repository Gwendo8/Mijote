import { Op } from 'sequelize';
import { PlanningShare, User } from '../models/index.js';

// Seul endroit qui lit et écrit les partages de planning.
const withUser = [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName'] }];
const withOwner = [{ model: User, as: 'owner', attributes: ['id', 'firstName', 'lastName'] }];

export const listOfOwner = (ownerId) =>
  PlanningShare.findAll({
    where: { ownerId },
    include: withUser,
    order: [
      ['weekStart', 'ASC NULLS FIRST'],
      ['id', 'ASC'],
    ],
  });

// Partage identique déjà existant (userId et weekStart vides compris)
export const findSame = (ownerId, userId, weekStart) =>
  PlanningShare.findOne({ where: { ownerId, userId, weekStart } });

export const create = (data) => PlanningShare.create(data);

export const findOwned = (ownerId, id) => PlanningShare.findOne({ where: { id, ownerId } });

export const remove = (share) => share.destroy();

// Les partages qui me donnent accès au planning d'autres personnes (à moi ou à tout le monde)
export const listVisibleTo = (viewerId) =>
  PlanningShare.findAll({
    where: { ownerId: { [Op.ne]: viewerId }, userId: { [Op.or]: [viewerId, null] } },
    include: withOwner,
    order: [
      ['ownerId', 'ASC'],
      ['weekStart', 'ASC'],
    ],
  });

// Cette personne peut-elle lire la semaine (lundi) de ce planning ?
export const canView = async (ownerId, viewerId, weekStart) =>
  (await PlanningShare.count({
    where: {
      ownerId,
      userId: { [Op.or]: [viewerId, null] },
      weekStart: { [Op.or]: [weekStart, null] },
    },
  })) > 0;
