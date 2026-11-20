import { afterEach, describe, expect, it, vi } from 'vitest';
import { mockApi } from '../../test/helpers.jsx';
import {
  createFood,
  deleteFood,
  getFoodByBarcode,
  listMyFoods,
  removeFoodCorrection,
  saveFoodCorrection,
  searchFoods,
  searchOffFoods,
  updateFood,
} from './foodsService.js';

afterEach(() => vi.unstubAllGlobals());

describe('foodsService', () => {
  it('cherche avec la source et la limite, sans paramètre vide', async () => {
    const fetchMock = mockApi({
      'GET /foods?q=skyr&source=ciqual&limit=50': { body: { items: [] } },
    });
    await searchFoods({ q: 'skyr', source: 'ciqual', limit: 50, page: undefined });
    expect(fetchMock.mock.calls[0][0]).toBe('/api/foods?q=skyr&source=ciqual&limit=50');
  });

  it('liste mes aliments, lit un code-barres et cherche chez Open Food Facts', async () => {
    const fetchMock = mockApi({
      'GET /foods/mine?limit=50': { body: { items: [] } },
      'GET /foods/barcode/5060334870123': { body: { id: 1 } },
      'GET /foods/off/search?q=skyr+vanille': { body: { items: [], total: 0 } },
    });
    await listMyFoods({ limit: 50 });
    await getFoodByBarcode('5060334870123');
    await searchOffFoods('skyr vanille');
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('crée, modifie et supprime avec la bonne méthode et le bon corps', async () => {
    const fetchMock = mockApi({
      'POST /foods': { status: 201, body: { id: 9 } },
      'PATCH /foods/9': { body: { id: 9 } },
      'DELETE /foods/9': { body: { result: 'deleted' } },
    });
    await createFood({ name: 'Skyr', energyKcal: 57 });
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ name: 'Skyr', energyKcal: 57 });
    await updateFood(9, { name: 'Skyr maison' });
    expect(fetchMock.mock.calls[1][1].method).toBe('PATCH');
    await expect(deleteFood(9)).resolves.toEqual({ result: 'deleted' });
  });

  it('enregistre et retire une correction admin', async () => {
    const fetchMock = mockApi({
      'PUT /admin/foods/3/correction': { body: { id: 3 } },
      'DELETE /admin/foods/3/correction': { status: 204 },
    });
    await saveFoodCorrection(3, { energyKcal: 63 });
    expect(fetchMock.mock.calls[0][1].method).toBe('PUT');
    await removeFoodCorrection(3);
    expect(fetchMock.mock.calls[1][1].method).toBe('DELETE');
  });
});
