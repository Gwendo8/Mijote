import { col, fn, Op, where } from 'sequelize';

// Recherche « contient », sans tenir compte des majuscules ni des accents (« creme » trouve « Crème »).
// unaccent : extension PostgreSQL activée par la migration 20261120125704-enable-unaccent.
// La même transformation est appliquée à la colonne et au texte cherché, par la base (modèle de Platine).
const normalized = (expression) => fn('unaccent', fn('lower', expression));

// % et _ ont un sens spécial dans LIKE : on les neutralise pour chercher le caractère lui-même
export function escapeLike(text) {
  return text.replace(/[\\%_]/g, '\\$&');
}

// Condition « la colonne contient q »
export function contains(column, q) {
  return where(normalized(col(column)), { [Op.like]: normalized(`%${escapeLike(q)}%`) });
}

// Les mots de la recherche (séparés par des espaces)
export const words = (q) => q.trim().split(/\s+/).filter(Boolean);
