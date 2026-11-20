import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Aucun test n'appelle Internet : le DNS et fetch sont imités
vi.mock('node:dns/promises', () => ({ lookup: vi.fn() }));

const { lookup } = await import('node:dns/promises');
const { default: app } = await import('../../src/app.js');
const { Recipe } = await import('../../src/models/index.js');
const { createUser, loginAgent, resetAll } = await import('../helpers.js');

const FICHE = {
  '@context': 'https://schema.org',
  '@type': 'Recipe',
  name: 'Gratin dauphinois',
  description: 'Un classique',
  recipeYield: '6 personnes',
  prepTime: 'PT20M',
  cookTime: 'PT1H15M',
  image: 'https://exemple.fr/gratin.jpg',
  recipeIngredient: ['1 kg de pommes de terre', '40 cl de crème'],
  recipeInstructions: [
    { '@type': 'HowToStep', text: 'Éplucher.' },
    { '@type': 'HowToStep', text: 'Cuire.' },
  ],
};

const page = (json) =>
  new Response(`<html><script type="application/ld+json">${JSON.stringify(json)}</script></html>`, {
    status: 200,
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });

let agent;
beforeEach(async () => {
  await resetAll();
  lookup.mockResolvedValue([{ address: '93.184.216.34', family: 4 }]);
  agent = await loginAgent(await createUser());
});
afterEach(() => vi.unstubAllGlobals());

const importUrl = (url) => agent.post('/api/recipes/import').send({ url });

describe('POST /api/recipes/import', () => {
  it('refuse sans session (401)', async () => {
    const res = await request(app).post('/api/recipes/import').send({ url: 'https://a.fr' });
    expect(res.status).toBe(401);
  });

  it('renvoie un brouillon sans rien enregistrer', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(page(FICHE)));
    const res = await importUrl('https://exemple.fr/gratin');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      title: 'Gratin dauphinois',
      description: 'Un classique',
      instructions: 'Éplucher.\nCuire.',
      servings: 6,
      prepTimeMinutes: 20,
      cookTimeMinutes: 75,
      sourceUrl: 'https://exemple.fr/gratin',
      imageUrl: 'https://exemple.fr/gratin.jpg',
      ingredients: [{ label: '1 kg de pommes de terre' }, { label: '40 cl de crème' }],
    });
    expect(await Recipe.count()).toBe(0);
  });

  it('répond 422 quand la page n’a pas de fiche recette (cas de TikTok)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(page({ '@type': 'VideoObject' })));
    const res = await importUrl('https://www.tiktok.com/@qq/video/1');
    expect(res.status).toBe(422);
    expect(res.body.error.message).toMatch(/Aucune recette trouvée/);

    const image = new Response('x', { status: 200, headers: { 'content-type': 'image/png' } });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(image));
    expect((await importUrl('https://exemple.fr/image.png')).status).toBe(422);
  });

  it('refuse les adresses invalides ou internes (400) sans appeler Internet', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    for (const url of [
      'pas une adresse',
      'ftp://exemple.fr',
      'http://127.0.0.1:3000/api/health',
      'http://192.168.1.1/',
    ]) {
      expect((await importUrl(url)).status).toBe(400);
    }
    lookup.mockResolvedValue([{ address: '10.0.0.4', family: 4 }]);
    expect((await importUrl('https://piege.exemple.fr/')).status).toBe(400);
    expect((await agent.post('/api/recipes/import').send({})).status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('refuse une redirection vers une adresse interne (400)', async () => {
    const redirect = new Response(null, {
      status: 302,
      headers: { location: 'http://localhost/admin' },
    });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(redirect));
    expect((await importUrl('https://exemple.fr/')).status).toBe(400);
  });

  it('répond 502 si la page est injoignable, en erreur ou trop lourde', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fetch failed')));
    expect((await importUrl('https://exemple.fr/')).status).toBe(502);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('non', { status: 500 })));
    expect((await importUrl('https://exemple.fr/')).status).toBe(502);
    const big = new Response('x'.repeat(2 * 1024 * 1024 + 10), {
      status: 200,
      headers: { 'content-type': 'text/html' },
    });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(big));
    expect((await importUrl('https://exemple.fr/')).status).toBe(502);
  });

  it('crée une recette avec la photo de l’import (réduite), et sans photo si le téléchargement échoue', async () => {
    const sharp = (await import('sharp')).default;
    const image = await sharp({
      create: { width: 40, height: 40, channels: 3, background: '#fff' },
    })
      .jpeg()
      .toBuffer();
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          new Response(image, { status: 200, headers: { 'content-type': 'image/jpeg' } }),
        ),
    );
    const payload = {
      kind: 'recipe',
      title: 'Gratin',
      ingredients: [{ label: '1 kg de pommes de terre' }],
      photoUrl: 'https://exemple.fr/gratin.jpg',
    };
    const created = await agent.post('/api/recipes').send(payload);
    expect(created.status).toBe(201);
    expect(created.body.photoUrl).toBeTruthy();

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fetch failed')));
    const without = await agent.post('/api/recipes').send(payload);
    expect(without.status).toBe(201);
    expect(without.body.photoUrl).toBeNull();
  });
});
