import { col, fn, where } from 'sequelize';
import { Tag } from '../models/index.js';

export const list = (options = {}) =>
  Tag.findAll({
    order: [
      ['position', 'ASC'],
      ['id', 'ASC'],
    ],
    ...options,
  });

export const findById = (id, options = {}) => Tag.findByPk(id, options);

// Existe-t-il déjà une étiquette de ce nom (sans tenir compte des majuscules) ? `exceptId` : on ignore celle-ci.
export async function nameTaken(name, exceptId, options = {}) {
  const tags = await Tag.findAll({
    where: where(fn('lower', col('name')), name.toLowerCase()),
    ...options,
  });
  return tags.some((tag) => tag.id !== exceptId);
}

export const maxPosition = (options = {}) => Tag.max('position', options);
export const create = (data, options = {}) => Tag.create(data, options);
export const update = (id, data, options = {}) => Tag.update(data, { where: { id }, ...options });
export const remove = (id) => Tag.destroy({ where: { id } });
