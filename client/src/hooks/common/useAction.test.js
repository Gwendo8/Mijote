import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ApiError } from '../../services/api.js';
import { useAction } from './useAction.js';

describe('useAction', () => {
  it('passe par « en cours » puis revient au calme avec le résultat', async () => {
    let resolve;
    const action = () => new Promise((r) => (resolve = r));
    const { result } = renderHook(() => useAction(action));

    let promise;
    act(() => {
      promise = result.current.run();
    });
    expect(result.current.pending).toBe(true);

    await act(async () => {
      resolve('fait');
      expect(await promise).toEqual({ ok: true, data: 'fait' });
    });
    expect(result.current.pending).toBe(false);
  });

  it('range le message et les erreurs de champs', async () => {
    const error = new ApiError(400, 'Données invalides', [
      { path: ['email'], message: 'Adresse invalide' },
    ]);
    const action = () => Promise.reject(error);
    const { result } = renderHook(() => useAction(action));

    await act(async () => {
      expect((await result.current.run()).ok).toBe(false);
    });
    expect(result.current.error).toBe('Certains champs sont à corriger.');
    expect(result.current.fieldErrors).toEqual({ email: 'Adresse invalide' });

    act(() => result.current.reset());
    expect(result.current.error).toBeNull();
  });

  it('ignore la réponse arrivée après le démontage', async () => {
    let resolve;
    const action = () => new Promise((r) => (resolve = r));
    const { result, unmount } = renderHook(() => useAction(action));
    let promise;
    act(() => {
      promise = result.current.run();
    });
    unmount();
    resolve('tard');
    await expect(promise).resolves.toEqual({ ok: true, data: 'tard' });
  });
});
