import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiError, mockApi } from '../../test/helpers.jsx';
import { useFoodSearch } from './useFoodSearch.js';

afterEach(() => vi.unstubAllGlobals());

describe('useFoodSearch', () => {
  it('attend 2 lettres avant de chercher', () => {
    const fetchMock = mockApi();
    const { result } = renderHook(() => useFoodSearch('s', 'all'));
    expect(result.current.idle).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('passe de chargement à résultats, avec la source du filtre', async () => {
    const fetchMock = mockApi({
      'GET /foods?q=skyr&source=ciqual&limit=50': { body: { items: [{ id: 1 }], total: 1 } },
    });
    const { result } = renderHook(() => useFoodSearch('skyr', 'ciqual'));
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.items).toEqual([{ id: 1 }]));
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('liste mes aliments quand le filtre « Mes aliments » n’a pas de recherche', async () => {
    mockApi({ 'GET /foods/mine?limit=50': { body: { items: [{ id: 4 }], total: 1 } } });
    const { result } = renderHook(() => useFoodSearch('', 'user'));
    await waitFor(() => expect(result.current.items).toHaveLength(1));
    expect(result.current.mine).toBe(true);
  });

  it('donne une phrase claire en cas d’erreur', async () => {
    mockApi({ 'GET /foods?q=skyr&limit=50': apiError(500, 'boom') });
    const { result } = renderHook(() => useFoodSearch('skyr', 'all'));
    await waitFor(() => expect(result.current.error).toMatch(/erreur est survenue/));
  });
});
