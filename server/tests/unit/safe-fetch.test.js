import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('node:dns/promises', () => ({ lookup: vi.fn() }));

const { lookup } = await import('node:dns/promises');
const { ipIsInternal, safeFetch } = await import('../../src/integrations/safeFetch.js');

const publicDns = (address = '93.184.216.34') => lookup.mockResolvedValue([{ address, family: 4 }]);
const html = (body = '<p>ok</p>', init = {}) =>
  new Response(body, { status: 200, headers: { 'content-type': 'text/html' }, ...init });

beforeEach(() => publicDns());
afterEach(() => vi.unstubAllGlobals());

describe('ipIsInternal', () => {
  it('reconnaît les adresses internes', () => {
    for (const ip of [
      '127.0.0.1',
      '10.0.0.5',
      '192.168.1.20',
      '172.16.0.1',
      '169.254.169.254',
      '100.64.0.1',
      '0.0.0.0',
      '::1',
      '::',
      'fd12:3456::1',
      'fe80::1',
      '::ffff:127.0.0.1',
      '::ffff:7f00:1',
    ]) {
      expect(ipIsInternal(ip), ip).toBe(true);
    }
  });

  it('laisse passer les adresses publiques', () => {
    for (const ip of ['93.184.216.34', '8.8.8.8', '172.32.0.1', '2606:4700::1111']) {
      expect(ipIsInternal(ip), ip).toBe(false);
    }
  });
});

describe('safeFetch', () => {
  const options = { maxBytes: 1000 };

  it('refuse les adresses invalides ou non http(s) (400), sans appeler fetch', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    for (const url of [
      'pas une adresse',
      'file:///etc/passwd',
      'ftp://exemple.fr/a',
      'https://a:b@exemple.fr',
    ]) {
      await expect(safeFetch(url, options)).rejects.toMatchObject({ status: 400 });
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('refuse les adresses internes, écrites en IP ou résolues par le DNS (400)', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    for (const url of [
      'http://127.0.0.1/',
      'http://localhost:3000/',
      'http://[::1]/',
      'http://192.168.1.1/',
    ]) {
      await expect(safeFetch(url, options)).rejects.toMatchObject({ status: 400 });
    }
    publicDns('10.0.0.8'); // un nom de domaine qui pointe vers le réseau de la maison
    await expect(safeFetch('https://piege.exemple.fr/', options)).rejects.toMatchObject({
      status: 400,
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('vérifie aussi chaque redirection', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(null, { status: 302, headers: { location: 'http://169.254.169.254/' } }),
      );
    vi.stubGlobal('fetch', fetchMock);
    await expect(safeFetch('https://exemple.fr/', options)).rejects.toMatchObject({ status: 400 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('suit jusqu’à 3 redirections puis abandonne (502)', async () => {
    const redirect = () => new Response(null, { status: 301, headers: { location: '/suite' } });
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async () => redirect()),
    );
    await expect(safeFetch('https://exemple.fr/', options)).rejects.toMatchObject({ status: 502 });

    const fetchMock = vi.fn().mockResolvedValueOnce(redirect()).mockResolvedValueOnce(html('fin'));
    vi.stubGlobal('fetch', fetchMock);
    const result = await safeFetch('https://exemple.fr/', options);
    expect(result.buffer.toString()).toBe('fin');
    expect(result.finalUrl).toBe('https://exemple.fr/suite');
  });

  it('refuse une page trop lourde, annoncée ou non (502)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(html('x'.repeat(2000))));
    await expect(safeFetch('https://exemple.fr/', options)).rejects.toMatchObject({ status: 502 });
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(html('petit', { headers: { 'content-length': '5000' } })),
    );
    await expect(safeFetch('https://exemple.fr/', options)).rejects.toMatchObject({ status: 502 });
  });

  it('répond 502 si la page est en erreur ou injoignable, et refuse un nom sans adresse', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('non', { status: 404 })));
    await expect(safeFetch('https://exemple.fr/', options)).rejects.toMatchObject({ status: 502 });
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fetch failed')));
    await expect(safeFetch('https://exemple.fr/', options)).rejects.toMatchObject({ status: 502 });
    lookup.mockResolvedValue([]); // le nom ne correspond à aucune adresse
    await expect(safeFetch('https://inconnu.example/', options)).rejects.toMatchObject({
      status: 400,
    });
  });
});
