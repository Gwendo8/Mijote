import { afterEach, describe, expect, it, vi } from 'vitest';
import { changePassword, deleteAccount, updateProfile } from './meService.js';

afterEach(() => vi.unstubAllGlobals());

async function call(fn, ...args) {
  const fetchMock = vi.fn().mockImplementation(async () => Response.json({}));
  vi.stubGlobal('fetch', fetchMock);
  await fn(...args);
  const [url, options] = fetchMock.mock.calls[0];
  return { url, method: options.method, body: JSON.parse(options.body) };
}

describe('meService', () => {
  it('updateProfile : PATCH /api/me', async () => {
    expect(await call(updateProfile, { displayName: 'A' })).toEqual({
      url: '/api/me',
      method: 'PATCH',
      body: { displayName: 'A' },
    });
  });
  it('changePassword : PUT /api/me/password', async () => {
    const values = { currentPassword: 'a', newPassword: 'b' };
    expect(await call(changePassword, values)).toEqual({
      url: '/api/me/password',
      method: 'PUT',
      body: values,
    });
  });
  it('deleteAccount : DELETE /api/me avec le mot de passe', async () => {
    expect(await call(deleteAccount, 'secret')).toEqual({
      url: '/api/me',
      method: 'DELETE',
      body: { password: 'secret' },
    });
  });
});
