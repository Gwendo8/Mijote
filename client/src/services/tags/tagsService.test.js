import { afterEach, expect, it, vi } from 'vitest';
import { mockApi } from '../../test/helpers.jsx';
import { searchUsers } from '../users/usersService.js';
import { listTags } from './tagsService.js';

afterEach(() => vi.unstubAllGlobals());

it('liste les étiquettes', async () => {
  const fetchMock = mockApi({ 'GET /tags': { body: [] } });
  await listTags();
  expect(fetchMock.mock.calls[0][0]).toBe('/api/tags');
});

it('cherche une personne par son nom, en protégeant les caractères spéciaux', async () => {
  const fetchMock = mockApi({ 'GET /users/search?q=l%C3%A9a%20d': { body: [] } });
  await searchUsers('léa d');
  expect(fetchMock.mock.calls[0][0]).toBe('/api/users/search?q=l%C3%A9a%20d');
});
