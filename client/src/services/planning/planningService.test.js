import { afterEach, describe, expect, it, vi } from 'vitest';
import { mockApi } from '../../test/helpers.jsx';
import {
  addEntry,
  copyDay,
  createShare,
  createSlot,
  deleteEntry,
  deleteShare,
  deleteSlot,
  getWeek,
  listSharedWithMe,
  listShares,
  listSlots,
  updateEntry,
  updateSlot,
} from './planningService.js';

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

describe('planningService, bloc 5b', () => {
  it('copie un jour vers plusieurs jours', async () => {
    const fetchMock = mockApi({ 'POST /planning/copy-day': { status: 201, body: { count: 2 } } });
    await copyDay('2026-11-17', ['2026-11-18', '2026-11-25']);
    expect(appel(fetchMock)).toMatchObject({
      url: '/api/planning/copy-day',
      method: 'POST',
      body: { fromDate: '2026-11-17', toDates: ['2026-11-18', '2026-11-25'] },
    });
  });

  it('crée, modifie et supprime un créneau', async () => {
    const fetchMock = mockApi({
      'POST /planning/slots': { status: 201, body: {} },
      'PATCH /planning/slots/4': { body: {} },
      'DELETE /planning/slots/4': { status: 204 },
    });
    await createSlot('Avant le sport');
    await updateSlot(4, { isHidden: true, position: 1 });
    await deleteSlot(4);
    const [a, b, c] = fetchMock.mock.calls.map(([url, o]) => [url, o.method, o.body]);
    expect(a).toEqual(['/api/planning/slots', 'POST', '{"name":"Avant le sport"}']);
    expect(b).toEqual(['/api/planning/slots/4', 'PATCH', '{"isHidden":true,"position":1}']);
    expect(c).toEqual(['/api/planning/slots/4', 'DELETE', undefined]);
  });

  it('gère les partages', async () => {
    const fetchMock = mockApi({
      'GET /planning/shares': { body: [] },
      'POST /planning/shares': { status: 201, body: {} },
      'DELETE /planning/shares/7': { status: 204 },
      'GET /planning/shared-with-me': { body: [] },
    });
    await listShares();
    await createShare(null, '2026-11-16');
    await deleteShare(7);
    await listSharedWithMe();
    const calls = fetchMock.mock.calls.map(
      ([url, o]) => `${o.method ?? 'GET'} ${url} ${o.body ?? ''}`,
    );
    expect(calls).toEqual([
      'GET /api/planning/shares ',
      'POST /api/planning/shares {"userId":null,"weekStart":"2026-11-16"}',
      'DELETE /api/planning/shares/7 ',
      'GET /api/planning/shared-with-me ',
    ]);
  });
});
