import { Op } from 'sequelize';
import { User } from '../models/index.js';

// Seul endroit qui lit et écrit les comptes. passwordHash est exclu par défaut : il ne sort que par
// les fonctions « WithPassword », réservées aux vérifications de mot de passe.
const PUBLIC = { exclude: ['passwordHash'] };

export const findById = (id, options = {}) => User.findByPk(id, { attributes: PUBLIC, ...options });
export const findByIdWithPassword = (id) => User.findByPk(id);
export const findByEmail = (email) => User.findOne({ where: { email }, attributes: PUBLIC });
export const findByEmailWithPassword = (email) => User.findOne({ where: { email } });

export const create = (data, options = {}) => User.create(data, options);

export async function update(id, data, options = {}) {
  await User.update(data, { where: { id }, ...options });
  return findById(id, options);
}

export const remove = (id) => User.destroy({ where: { id } });
export const countAdmins = () => User.count({ where: { role: 'admin' } });
export const countOtherAdmins = (id) =>
  User.count({ where: { role: 'admin', id: { [Op.ne]: id } } });
