import * as usersRepository from '../repositories/users.repository.js';

// Recherche d'une personne par son nom (pour partager une recette ou un planning) :
// ni e-mail, ni soi-même, 10 résultats au plus.
export async function search(userId, q) {
  const users = await usersRepository.searchByName(q, userId);
  return users.map((user) => ({ id: user.id, displayName: user.displayName }));
}
