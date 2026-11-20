import { useState } from 'react';
import { getFood } from '../../services/foods/foodsService.js';
import { useLoad } from '../common/useLoad.js';

// Un aliment par son identifiant : { food, loading, error, reload } (reload après une correction).
export function useFood(id) {
  const [version, setVersion] = useState(0);
  const { data, loading, error } = useLoad(id ? `${id}|${version}` : null, () => getFood(id));
  return { food: data, loading, error, reload: () => setVersion((v) => v + 1) };
}
