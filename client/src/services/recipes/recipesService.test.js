import { afterEach, describe, expect, it, vi } from 'vitest';
import { mockApi } from '../../test/helpers.jsx';
import {
  copyRecipe,
  createRecipe,
  deleteRecipe,
  deleteRecipePhoto,
  getRecipe,
  importRecipe,
  listRecipes,
  updateRecipe,
  uploadRecipePhoto,
} from './recipesService.js';

afterEach(() => vi.unstubAllGlobals());

describe('recipesService', () => {
  it('liste avec les filtres, sans paramètre vide, étiquettes séparées par des virgules', async () => {
    const fetchMock = mockApi({
      'GET /recipes?kind=recipe&scope=mine&q=poulet&tagIds=2%2C4&maxCalories=500&limit=50': {
        body: { items: [] },
      },
    });
    await listRecipes({
      kind: 'recipe',
      scope: 'mine',
      q: 'poulet',
      tagIds: [2, 4],
      maxCalories: 500,
      minProteins: '',
      limit: 50,
    });
    expect(fetchMock.mock.calls[0][0]).toBe(
      '/api/recipes?kind=recipe&scope=mine&q=poulet&tagIds=2%2C4&maxCalories=500&limit=50',
    );
  });

  it('lit, crée, modifie (PUT), supprime et copie une recette', async () => {
    const fetchMock = mockApi({
      'GET /recipes/12': { body: { id: 12 } },
      'POST /recipes': { status: 201, body: { id: 13 } },
      'PUT /recipes/12': { body: { id: 12 } },
      'DELETE /recipes/12': { status: 204 },
      'POST /recipes/12/copy': { status: 201, body: { id: 14 } },
    });
    await getRecipe(12);
    await createRecipe({ kind: 'recipe', title: 'Soupe' });
    await updateRecipe(12, { title: 'Soupe' });
    await deleteRecipe(12);
    await copyRecipe(12);
    const calls = fetchMock.mock.calls.map(
      ([url, options = {}]) => `${options.method ?? 'GET'} ${url}`,
    );
    expect(calls).toEqual([
      'GET /api/recipes/12',
      'POST /api/recipes',
      'PUT /api/recipes/12',
      'DELETE /api/recipes/12',
      'POST /api/recipes/12/copy',
    ]);
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({ kind: 'recipe', title: 'Soupe' });
  });

  it('importe une adresse', async () => {
    const fetchMock = mockApi({ 'POST /recipes/import': { body: { title: 'x' } } });
    await importRecipe('https://site.fr/recette');
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ url: 'https://site.fr/recette' });
  });

  it('envoie la photo en multipart dans le champ « photo » et la supprime', async () => {
    const fetchMock = mockApi({
      'PUT /recipes/12/photo': { body: { photoUrl: '/x' } },
      'DELETE /recipes/12/photo': { status: 204 },
    });
    const file = new File(['abc'], 'p.jpg', { type: 'image/jpeg' });
    await uploadRecipePhoto(12, file);
    await deleteRecipePhoto(12);
    const options = fetchMock.mock.calls[0][1];
    expect(options.body).toBeInstanceOf(FormData);
    expect(options.body.get('photo')).toBeInstanceOf(File);
    expect(options.headers['Content-Type']).toBeUndefined();
    expect(fetchMock.mock.calls[1][1].method).toBe('DELETE');
  });
});
