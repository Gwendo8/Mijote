import { apiFetch } from '../api.js';

// Mon profil (API.md, section 2 « Connecté »).
export const updateProfile = (values) => apiFetch('/me', { method: 'PATCH', json: values });
export const changePassword = (values) => apiFetch('/me/password', { method: 'PUT', json: values });
export const deleteAccount = (password) =>
  apiFetch('/me', { method: 'DELETE', json: { password } });
