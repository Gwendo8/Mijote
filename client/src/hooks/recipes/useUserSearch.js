import { searchUsers } from '../../services/users/usersService.js';
import { useLoad } from '../common/useLoad.js';

export const MIN_NAME_LENGTH = 2;

// Cherche une personne par son nom (2 lettres au moins) : { people, loading, error, idle }.
export function useUserSearch(q) {
  const term = q.trim();
  const { data, loading, error } = useLoad(term.length >= MIN_NAME_LENGTH ? term : null, () =>
    searchUsers(term),
  );
  return { people: data ?? [], loading, error, idle: term.length < MIN_NAME_LENGTH };
}
