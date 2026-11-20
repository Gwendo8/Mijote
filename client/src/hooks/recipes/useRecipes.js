import { useState } from 'react';
import { listRecipes } from '../../services/recipes/recipesService.js';
import { useLoad } from '../common/useLoad.js';

export const LIMIT = 50;

// Liste des recettes (ou des idées avec kind: 'idea') : { items, total, loading, error, reload }.
// `filters` : { kind, scope, q, tagIds, maxCalories, minProteins, sort, order }. Un changement de filtre recharge.
export function useRecipes(filters) {
  const [version, setVersion] = useState(0);
  const key = `${JSON.stringify(filters)}|${version}`;
  const { data, loading, error } = useLoad(key, () => listRecipes({ ...filters, limit: LIMIT }));
  return {
    items: data?.items ?? [],
    total: data?.total ?? 0,
    loading,
    error,
    reload: () => setVersion((v) => v + 1),
  };
}
