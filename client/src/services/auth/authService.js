import { apiFetch } from '../api.js';

// Un appel par route de API.md (section 2). Aucun état ici.
export const getPublicSettings = () => apiFetch('/settings/public');
export const getInvitation = (token) => apiFetch(`/auth/invitations/${encodeURIComponent(token)}`);
export const getResetLink = (token) =>
  apiFetch(`/auth/reset-password/${encodeURIComponent(token)}`);
export const register = (values) => apiFetch('/auth/register', { method: 'POST', json: values });
export const login = (values) => apiFetch('/auth/login', { method: 'POST', json: values });
export const forgotPassword = (email) =>
  apiFetch('/auth/forgot-password', { method: 'POST', json: { email } });
export const resetPassword = (values) =>
  apiFetch('/auth/reset-password', { method: 'POST', json: values });
export const getMe = () => apiFetch('/auth/me');
export const logout = () => apiFetch('/auth/logout', { method: 'POST' });
export const logoutAll = () => apiFetch('/auth/logout-all', { method: 'POST' });
