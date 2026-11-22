import { afterEach, describe, expect, it, vi } from 'vitest';
import { mockApi } from '../../test/helpers.jsx';
import { addEntry, deleteEntry, getWeek, listSlots, updateEntry } from './planningService.js';

afterEach(() => vi.unstubAllGlobals());

function appel(fetchMock) {
  const [url, options] = fetchMock.mock.calls[0];
  return { url, method: options.method ?? 'GET', body: options.body && JSON.parse(options.body) };
}

describe('planningService', () => {
  it('lit une semaine', async () => {
    const fetchMock = mockApi({ 'GET /planning?week=2026-11-16': { body: { days: [] } } });
    await getWeek('2026-11-16');
    expect(appel(fetchMock).url).toBe('/api/planning?week=2026-11-16');
  });

  it('lit la semaine d’une autre personne', async () => {
    const fetchMock = mockApi({ 'GET /planning?week=2026-11-16&userId=5': { body: {} } });
    await getWeek('2026-11-16', 5);
    expect(appel(fetchMock).url).toBe('/api/planning?week=2026-11-16&userId=5');
  });

  it('liste les créneaux', async () => {
    const fetchMock = mockApi({ 'GET /planning/slots': { body: [] } });
    await listSlots();
    expect(appel(fetchMock).method).toBe('GET');
  });

  it('ajoute, modifie et retire une entrée', async () => {
    const fetchMock = mockApi({
      'POST /planning/entries': { status: 201, body: { id: 1 } },
      'PATCH /planning/entries/1': { body: { id: 1 } },
      'DELETE /planning/entries/1': { status: 204 },
    });
    await addEntry({ date: '2026-11-19', slotId: 2, recipeId: 12, servings: 1 });
    await updateEntry(1, { slotId: 3 });
    await deleteEntry(1);
    const calls = fetchMock.mock.calls.map(([url, o]) => [o.method, url, o.body]);
    expect(calls).toEqual([
      [
        'POST',
        '/api/planning/entries',
        '{"date":"2026-11-19","slotId":2,"recipeId":12,"servings":1}',
      ],
      ['PATCH', '/api/planning/entries/1', '{"slotId":3}'],
      ['DELETE', '/api/planning/entries/1', undefined],
    ]);
  });
});
