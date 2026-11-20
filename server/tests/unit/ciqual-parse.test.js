import { describe, expect, it } from 'vitest';
import { parseAmount, parseCiqual } from '../../src/services/ciqual-import.service.js';
import { toFoodData } from '../../src/integrations/openfoodfacts.js';
import { normalizeSearchText } from '../../src/utils/text.js';
import { alimXml, compoXml, groupsXml } from '../fixtures/ciqual.js';

describe('parseAmount (valeurs de la table Ciqual)', () => {
  it.each([
    [' 12,5 ', 12.5],
    ['274', 274],
    ['0', 0],
    ['traces', 0],
    ['< 0,5', 0.5],
    ['< 2', 2],
    ['-', null],
    ['', null],
    [undefined, null],
    ['n.d.', null],
  ])('%j → %j', (text, expected) => {
    expect(parseAmount(text)).toBe(expected);
  });
});

describe('parseCiqual', () => {
  const foods = parseCiqual({ alim: alimXml, groups: groupsXml, compo: compoXml });

  it('lit le code, le nom, la catégorie et le nom de recherche', () => {
    expect(foods).toHaveLength(3);
    expect(foods[0]).toMatchObject({
      ciqualCode: '20047',
      name: 'Poulet, blanc, cuit',
      searchName: 'poulet, blanc, cuit',
      category: 'viandes cuites',
    });
    expect(foods[1].name).toBe('Crème fraîche, 30% MG, épaisse');
    expect(foods[1].searchName).toBe('creme fraiche, 30% mg, epaisse');
  });

  it('lit les teneurs utiles (kcal UE, protéines N x 6,25, glucides, lipides)', () => {
    expect(foods[0]).toMatchObject({ energyKcal: 151, proteinsG: 29.8, carbsG: 0, fatsG: 3.5 });
  });

  it('applique la règle « traces » = 0, « < x » = x, « - » = inconnu', () => {
    expect(foods[1]).toMatchObject({ energyKcal: 292, proteinsG: 2.2, carbsG: 0, fatsG: 30 });
    expect(foods[2]).toMatchObject({ energyKcal: null, proteinsG: null, carbsG: 0.5, fatsG: 0 });
  });

  it('se rabat sur le facteur de Jones quand la valeur préférée manque', () => {
    expect(foods[2].name).toBe('Aliment sans calories UE');
    // kcal 333 (Jones) absent aussi → null ; protéines 25000 absentes → null
  });
});

describe('normalizeSearchText', () => {
  it('met en minuscules et enlève les accents', () => {
    expect(normalizeSearchText('  Crème  BRÛLÉE ')).toBe('creme brulee');
    expect(normalizeSearchText('Œuf')).toBe('oeuf');
  });
});

describe('toFoodData (Open Food Facts)', () => {
  it('garde la première marque et la catégorie la plus précise', () => {
    const food = toFoodData({
      code: '3017620422003',
      product_name: 'Nutella',
      brands: 'Ferrero, Autre',
      categories: 'A, B, C',
      nutriments: { 'energy-kcal_100g': '539' },
    });
    expect(food).toMatchObject({
      barcode: '3017620422003',
      brand: 'Ferrero',
      category: 'C',
      energyKcal: 539,
    });
  });

  it('refuse un produit sans nom ou sans code-barres valable', () => {
    expect(toFoodData({ code: '3017620422003', product_name: '  ' })).toBeNull();
    expect(toFoodData({ code: 'abc', product_name: 'X' })).toBeNull();
    expect(toFoodData(null)).toBeNull();
  });

  it('prend les kJ en secours, et ignore les valeurs négatives ou énormes', () => {
    const food = toFoodData({
      code: '12345678',
      product_name: 'X',
      nutriments: { energy_100g: 418.4, proteins_100g: -1, carbohydrates_100g: 500 },
    });
    expect(food).toMatchObject({ energyKcal: 100, proteinsG: null, carbsG: null });
  });
});
