import { afterEach, describe, expect, it, vi } from 'vitest';
import * as auth from './authService.js';

function stub() {
  const fetchMock = vi.fn().mockImplementation(async () => Response.json({ ok: 1 }));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}
afterEach(() => vi.unstubAllGlobals());

describe('authService', () => {
  it.each([
    ['getPublicSettings', [], 'GET', '/api/settings/public', undefined],
    ['getResetLink', ['abc_-1'], 'GET', '/api/auth/reset-password/abc_-1', undefined],
    ['getInvitation', ['abc_-1'], 'GET', '/api/auth/invitations/abc_-1', undefined],
    [
      'register',
      [{ email: 'a@b.fr', password: 'x', firstName: 'A', lastName: 'B', token: 't' }],
      'POST',
      '/api/auth/register',
      { email: 'a@b.fr', password: 'x', firstName: 'A', lastName: 'B', token: 't' },
    ],
    [
      'login',
      [{ email: 'a@b.fr', password: 'x' }],
      'POST',
      '/api/auth/login',
      { email: 'a@b.fr', password: 'x' },
    ],
    ['forgotPassword', ['a@b.fr'], 'POST', '/api/auth/forgot-password', { email: 'a@b.fr' }],
    [
      'resetPassword',
      [{ token: 't', password: 'x' }],
      'POST',
      '/api/auth/reset-password',
      { token: 't', password: 'x' },
    ],
    ['getMe', [], 'GET', '/api/auth/me', undefined],
    ['logout', [], 'POST', '/api/auth/logout', undefined],
    ['logoutAll', [], 'POST', '/api/auth/logout-all', undefined],
  ])('%s appelle la bonne route', async (name, args, method, url, body) => {
    const fetchMock = stub();
    await auth[name](...args);
    const [calledUrl, options] = fetchMock.mock.calls[0];
    expect(calledUrl).toBe(url);
    expect(options.method ?? 'GET').toBe(method);
    expect(options.body ? JSON.parse(options.body) : undefined).toEqual(body);
  });
});
