import { useCallback } from 'react';
import {
  copyRecipe,
  createRecipe,
  deleteRecipe,
  deleteRecipePhoto,
  importRecipe,
  updateRecipe,
  uploadRecipePhoto,
} from '../../services/recipes/recipesService.js';
import { prepareImage, recipeToBody } from '../../utils/recipes.js';
import { useAction } from '../common/useAction.js';

// Envois : chacun renvoie { pending, error, fieldErrors, run }, `run` répond { ok, data }.
export const useCreateRecipe = () => useAction(createRecipe);
export const useImportRecipe = () => useAction(importRecipe);

export function useUpdateRecipe(id) {
  return useAction(useCallback((values) => updateRecipe(id, values), [id]));
}

export function useDeleteRecipe(id) {
  return useAction(useCallback(() => deleteRecipe(id), [id]));
}

export function useCopyRecipe(id) {
  return useAction(useCallback(() => copyRecipe(id), [id]));
}

// Partage : l'API remplace tout le contenu, on renvoie donc la recette telle qu'elle est avec la nouvelle visibilité.
export function useShareRecipe(recipe) {
  return useAction(
    useCallback(
      (visibility, sharedWith) =>
        updateRecipe(recipe.id, recipeToBody(recipe, { visibility, sharedWith })),
      [recipe],
    ),
  );
}

// « Revenir au calcul » : efface la correction à la main des calories et des protéines (même envoi complet que le partage).
export function useRevertManual(recipe) {
  return useAction(
    useCallback(
      () =>
        updateRecipe(
          recipe.id,
          recipeToBody(recipe, { caloriesPerServingManual: null, proteinsPerServingManual: null }),
        ),
      [recipe],
    ),
  );
}

// Photo choisie ou prise : convertie si besoin (HEIC…) puis envoyée.
export const useUploadPhoto = () =>
  useAction(useCallback(async (id, file) => uploadRecipePhoto(id, await prepareImage(file)), []));

export function useDeletePhoto(id) {
  return useAction(useCallback(() => deleteRecipePhoto(id), [id]));
}
