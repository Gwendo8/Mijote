import { useState } from 'react';
import { getRecipe } from '../../services/recipes/recipesService.js';
import { useLoad } from '../common/useLoad.js';

// Une recette par son identifiant : { recipe, loading, error, reload } (reload après un partage, une photo…).
export function useRecipe(id) {
  const [version, setVersion] = useState(0);
  const { data, loading, error } = useLoad(id ? `${id}|${version}` : null, () => getRecipe(id));
  return { recipe: data, loading, error, reload: () => setVersion((v) => v + 1) };
}
