import * as tagsRepository from '../repositories/tags.repository.js';
import { inTransaction } from '../repositories/transactions.js';
import { HttpError } from '../utils/HttpError.js';

const toTag = (tag) => ({ id: tag.id, name: tag.name, position: tag.position });

export async function list() {
  return (await tagsRepository.list()).map(toTag);
}

const alreadyExists = () => new HttpError(409, 'Cette étiquette existe déjà');

export async function create({ name }) {
  if (await tagsRepository.nameTaken(name)) throw alreadyExists();
  const last = await tagsRepository.maxPosition();
  const tag = await tagsRepository.create({ name, position: Number.isFinite(last) ? last + 1 : 0 });
  return toTag(tag);
}

// `position` = place voulue dans la liste (0 = en premier) : les autres étiquettes se décalent et
// toute la liste est renumérotée 0, 1, 2…, pour que l'ordre reste sans trou ni doublon.
export async function update(id, { name, position }) {
  return inTransaction(async (transaction) => {
    const tag = await tagsRepository.findById(id, { transaction });
    if (!tag) throw new HttpError(404, 'Étiquette introuvable');

    if (name !== undefined && name !== tag.name) {
      if (await tagsRepository.nameTaken(name, id, { transaction })) throw alreadyExists();
      await tagsRepository.update(id, { name }, { transaction });
    }

    if (position !== undefined) {
      const others = (await tagsRepository.list({ transaction })).filter((t) => t.id !== id);
      others.splice(Math.min(position, others.length), 0, tag);
      for (const [index, item] of others.entries()) {
        if (item.position !== index) {
          await tagsRepository.update(item.id, { position: index }, { transaction });
        }
      }
    }
    return toTag(await tagsRepository.findById(id, { transaction }));
  });
}

// Retirée aussi des recettes (cascade de la base)
export async function remove(id) {
  if (!(await tagsRepository.findById(id))) throw new HttpError(404, 'Étiquette introuvable');
  await tagsRepository.remove(id);
}
