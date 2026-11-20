import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ApiError } from '../../services/api.js';
import { useLoad } from './useLoad.js';

describe('useLoad', () => {
  it('passe de « chargement » à « données »', async () => {
    const { result } = renderHook(() => useLoad('a', () => Promise.resolve({ n: 1 })));
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.data).toEqual({ n: 1 }));
    expect(result.current.loading).toBe(false);
  });

  it('passe à « erreur » avec une phrase claire', async () => {
    const { result } = renderHook(() => useLoad('a', () => Promise.reject(new ApiError(404, 'x'))));
    await waitFor(() => expect(result.current.error).toMatch(/n'existe pas/));
  });

  it('recharge quand la clé change et ignore la réponse de l’ancienne', async () => {
    const { result, rerender } = renderHook(({ k }) => useLoad(k, () => Promise.resolve(k)), {
      initialProps: { k: 'a' },
    });
    await waitFor(() => expect(result.current.data).toBe('a'));
    rerender({ k: 'b' });
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.data).toBe('b'));
  });

  it('ne charge rien sans clé', () => {
    const { result } = renderHook(() => useLoad(null, () => Promise.reject(new Error('jamais'))));
    expect(result.current).toEqual({ data: null, error: null, loading: false });
  });
});
