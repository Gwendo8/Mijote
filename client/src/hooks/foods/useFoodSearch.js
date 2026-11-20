import { useState } from 'react';
import { listMyFoods, searchFoods } from '../../services/foods/foodsService.js';
import { useLoad } from '../common/useLoad.js';

const SOURCES = { all: undefined, ciqual: 'ciqual', off: 'off', user: 'user' };
export const MIN_LENGTH = 2;
const LIMIT = 50;

// Recherche d'aliments : { items, total, loading, error, idle, reload }.
// `filter` : all, ciqual, off (produits) ou user (mes aliments).
// Sans recherche (moins de 2 caractères) : « mes aliments » montre la liste de mes aliments, les autres attendent.
export function useFoodSearch(q, filter = 'all') {
  const [version, setVersion] = useState(0);
  const term = q.trim();
  const mine = filter === 'user' && term.length < MIN_LENGTH;
  let key = null;
  if (mine) key = `mine|${version}`;
  else if (term.length >= MIN_LENGTH) key = `${term}|${filter}|${version}`;

  const { data, loading, error } = useLoad(key, () =>
    mine
      ? listMyFoods({ limit: LIMIT })
      : searchFoods({ q: term, source: SOURCES[filter], limit: LIMIT }),
  );

  return {
    items: data?.items ?? [],
    total: data?.total ?? 0,
    loading,
    error,
    idle: key === null,
    mine,
    reload: () => setVersion((v) => v + 1),
  };
}
