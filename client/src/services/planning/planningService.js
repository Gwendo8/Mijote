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
export const copyDay = (fromDate, toDates) =>
  apiFetch('/planning/copy-day', { method: 'POST', json: { fromDate, toDates } });

// Créneaux
export const createSlot = (name) => apiFetch('/planning/slots', { method: 'POST', json: { name } });
export const updateSlot = (id, values) =>
  apiFetch(`/planning/slots/${id}`, { method: 'PATCH', json: values });
export const deleteSlot = (id) => apiFetch(`/planning/slots/${id}`, { method: 'DELETE' });

// Partages : `userId` null = tout le monde ; `weekStart` null = tout le planning.
export const listShares = () => apiFetch('/planning/shares');
export const createShare = (userId, weekStart) =>
  apiFetch('/planning/shares', { method: 'POST', json: { userId, weekStart } });
export const deleteShare = (id) => apiFetch(`/planning/shares/${id}`, { method: 'DELETE' });
export const listSharedWithMe = () => apiFetch('/planning/shared-with-me');
