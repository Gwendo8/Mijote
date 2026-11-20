import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiFetch, UNAUTHORIZED_EVENT } from './api.js';

afterEach(() => vi.unstubAllGlobals());

describe('apiFetch', () => {
  it('envoie un objet en JSON avec le bon en-tête', async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ ok: true }));
    vi.stubGlobal('fetch', fetchMock);

    await apiFetch('/x', { method: 'POST', json: { a: 1 } });

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/x');
    expect(options.body).toBe('{"a":1}');
    expect(options.headers['Content-Type']).toBe('application/json');
    expect(options.credentials).toBe('same-origin');
  });

  it("n'impose pas d'en-tête pour un fichier (FormData) : le navigateur pose le multipart", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({}));
    vi.stubGlobal('fetch', fetchMock);
    const body = new FormData();
    body.append('photo', new Blob(['x']), 'a.png');

    await apiFetch('/recipes/1/photo', { method: 'PUT', body });

    const options = fetchMock.mock.calls[0][1];
    expect(options.body).toBe(body);
    expect(options.headers['Content-Type']).toBeUndefined();
  });

  it('renvoie null pour une réponse 204', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 204 })));
    expect(await apiFetch('/x', { method: 'DELETE' })).toBeNull();
  });

  it("lance une ApiError avec le message et les détails de l'API", async () => {
    const body = {
      error: { message: 'Données invalides', details: [{ path: ['email'], message: 'x' }] },
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json(body, { status: 400 })));

    await expect(apiFetch('/x')).rejects.toMatchObject({
      status: 400,
      message: 'Données invalides',
      details: body.error.details,
    });
  });

  it('lance une ApiError de statut 0 quand le serveur est injoignable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('réseau')));
    const error = await apiFetch('/x').catch((e) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(0);
  });

  it('prévient la session sur un 401, sauf pour /auth/me', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(Response.json({ error: { message: 'non' } }, { status: 401 })),
    );
    const listener = vi.fn();
    window.addEventListener(UNAUTHORIZED_EVENT, listener);

    await apiFetch('/recipes').catch(() => {});
    await apiFetch('/auth/me').catch(() => {});

    window.removeEventListener(UNAUTHORIZED_EVENT, listener);
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
