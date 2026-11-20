import { apiFetch } from '../api.js';

// Recettes et idées de plats (API.md, section 5) : une seule famille de routes, `kind` dit laquelle.
function query(params) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') search.set(key, value);
  }
  const text = search.toString();
  return text ? `?${text}` : '';
}

export const listRecipes = ({
  kind,
  scope,
  q,
  tagIds,
  maxCalories,
  minProteins,
  sort,
  order,
  page,
  limit,
} = {}) =>
  apiFetch(
    `/recipes${query({
      kind,
      scope,
      q,
      tagIds: tagIds?.length ? tagIds.join(',') : undefined,
      maxCalories,
      minProteins,
      sort,
      order,
      page,
      limit,
    })}`,
  );
export const getRecipe = (id) => apiFetch(`/recipes/${id}`);
export const createRecipe = (values) => apiFetch('/recipes', { method: 'POST', json: values });
export const updateRecipe = (id, values) =>
  apiFetch(`/recipes/${id}`, { method: 'PUT', json: values });
export const deleteRecipe = (id) => apiFetch(`/recipes/${id}`, { method: 'DELETE' });
export const copyRecipe = (id) => apiFetch(`/recipes/${id}/copy`, { method: 'POST' });
export const importRecipe = (url) => apiFetch('/recipes/import', { method: 'POST', json: { url } });

// Photo : `file` est un File (JPEG, PNG ou WebP), envoyé en multipart dans le champ « photo ».
export function uploadRecipePhoto(id, file) {
  const body = new FormData();
  body.append('photo', file);
  return apiFetch(`/recipes/${id}/photo`, { method: 'PUT', body });
}
export const deleteRecipePhoto = (id) => apiFetch(`/recipes/${id}/photo`, { method: 'DELETE' });
