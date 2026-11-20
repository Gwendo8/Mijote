import { apiFetch } from '../api.js';

// Aliments (API.md, section 4) et corrections de l'admin (section 3).
function query(params) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') search.set(key, value);
  }
  const text = search.toString();
  return text ? `?${text}` : '';
}

export const searchFoods = ({ q, source, page, limit } = {}) =>
  apiFetch(`/foods${query({ q, source, page, limit })}`);
export const listMyFoods = ({ page, limit } = {}) =>
  apiFetch(`/foods/mine${query({ page, limit })}`);
export const getFood = (id) => apiFetch(`/foods/${id}`);
export const getFoodByBarcode = (code) => apiFetch(`/foods/barcode/${code}`);
export const searchOffFoods = (q) => apiFetch(`/foods/off/search${query({ q })}`);
export const createFood = (values) => apiFetch('/foods', { method: 'POST', json: values });
export const updateFood = (id, values) =>
  apiFetch(`/foods/${id}`, { method: 'PATCH', json: values });
export const deleteFood = (id) => apiFetch(`/foods/${id}`, { method: 'DELETE' });

export const saveFoodCorrection = (id, values) =>
  apiFetch(`/admin/foods/${id}/correction`, { method: 'PUT', json: values });
export const removeFoodCorrection = (id) =>
  apiFetch(`/admin/foods/${id}/correction`, { method: 'DELETE' });
