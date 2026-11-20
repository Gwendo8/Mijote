import { UniqueConstraintError } from 'sequelize';
import * as planningSharesRepository from '../repositories/planning-shares.repository.js';
import * as usersRepository from '../repositories/users.repository.js';
import { HttpError } from '../utils/HttpError.js';
import { mondayOf } from '../utils/dates.js';

const toShare = (share) => ({
  id: share.id,
  user: share.user ? { id: share.user.id, displayName: share.user.displayName } : null,
  weekStart: share.weekStart ?? null,
});

const invalid = (path, message) =>
  new HttpError(400, 'Données invalides', [{ path, message, code: 'custom' }]);

export async function list(userId) {
  return (await planningSharesRepository.listOfOwner(userId)).map(toShare);
}

export async function create(userId, { userId: targetId, weekStart }) {
  if (targetId === userId) throw invalid(['userId'], 'Ton planning est déjà à toi');
  const target = targetId === null ? null : await usersRepository.findById(targetId);
  if (targetId !== null && !target) throw new HttpError(404, 'Personne introuvable');
  const monday = weekStart ? mondayOf(weekStart) : null;

  const duplicate = () => new HttpError(409, 'Déjà partagé');
  if (await planningSharesRepository.findSame(userId, targetId, monday)) throw duplicate();
  try {
    const share = await planningSharesRepository.create({
      ownerId: userId,
      userId: targetId,
      weekStart: monday,
    });
    return toShare({ ...share.toJSON(), user: target });
  } catch (error) {
    if (error instanceof UniqueConstraintError) throw duplicate();
    throw error;
  }
}

export async function remove(userId, id) {
  const share = await planningSharesRepository.findOwned(userId, id);
  if (!share) throw new HttpError(404, 'Partage introuvable');
  await planningSharesRepository.remove(share);
}

// Les personnes dont je peux lire le planning
export async function sharedWithMe(userId) {
  const owners = new Map();
  for (const share of await planningSharesRepository.listVisibleTo(userId)) {
    if (!owners.has(share.ownerId)) {
      owners.set(share.ownerId, {
        owner: { id: share.owner.id, displayName: share.owner.displayName },
        allWeeks: false,
        weeks: [],
      });
    }
    const entry = owners.get(share.ownerId);
    if (share.weekStart === null) entry.allWeeks = true;
    else if (!entry.weeks.includes(share.weekStart)) entry.weeks.push(share.weekStart);
  }
  return [...owners.values()].sort((a, b) =>
    a.owner.displayName.localeCompare(b.owner.displayName, 'fr'),
  );
}

export const canView = planningSharesRepository.canView;
