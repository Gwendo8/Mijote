import { apiFetch } from '../api.js';

// Planning (API.md, section 6) : une fonction par route. Aucun état, aucun affichage.
export const getWeek = (week, userId) => {
  const search = new URLSearchParams({ week });
  if (userId) search.set('userId', userId);
  return apiFetch(`/planning?${search}`);
};
export const listSlots = () => apiFetch('/planning/slots');
export const addEntry = (values) => apiFetch('/planning/entries', { method: 'POST', json: values });
export const updateEntry = (id, values) =>
  apiFetch(`/planning/entries/${id}`, { method: 'PATCH', json: values });
export const deleteEntry = (id) => apiFetch(`/planning/entries/${id}`, { method: 'DELETE' });
