import { sequelize } from '../models/index.js';

// Exécute plusieurs écritures d'un bloc : si l'une échoue, aucune n'est gardée.
export const inTransaction = (work) => sequelize.transaction(work);
