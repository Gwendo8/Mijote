import { describe, expect, it } from 'vitest';
import {
  cleanBarcode,
  foodName,
  foodSummary,
  formatNombre,
  isBarcode,
  originalSummary,
  parseDecimal,
  portionValues,
  toFieldText,
} from './foods.js';

describe('utils/foods', () => {
  it('écrit les nombres à la française, « — » si inconnu', () => {
    expect(formatNombre(0.2)).toBe('0,2');
    expect(formatNombre(null)).toBe('—');
  });

  it('lit un nombre avec virgule ou point, null si illisible', () => {
    expect(parseDecimal('12,5')).toBe(12.5);
    expect(parseDecimal(' 0 ')).toBe(0);
    expect(parseDecimal('')).toBeNull();
    expect(parseDecimal('abc')).toBeNull();
    expect(parseDecimal('-3')).toBeNull();
    expect(toFieldText(0.2)).toBe('0,2');
  });

  it('ajoute la marque au nom sauf si elle y est déjà', () => {
    expect(foodName({ name: 'Skyr', brand: "Siggi's" })).toBe("Skyr, Siggi's");
    expect(foodName({ name: "Skyr Siggi's", brand: "Siggi's" })).toBe("Skyr Siggi's");
    expect(foodName({ name: 'Skyr', brand: null })).toBe('Skyr');
  });

  it('résume la source et les protéines', () => {
    expect(foodSummary({ source: 'ciqual', proteinsG: 11 })).toBe('Ciqual, 11 g de prot.');
    expect(foodSummary({ source: 'off', proteinsG: null })).toBe('Open Food Facts');
  });

  it('calcule une portion, null si une valeur est inconnue', () => {
    expect(portionValues({ energyKcal: 63, proteinsG: 11 }, 150)).toEqual({
      kcal: 94.5,
      proteinsG: 16.5,
    });
    expect(portionValues({ energyKcal: null, proteinsG: 1 }, 100).kcal).toBeNull();
    expect(portionValues({ energyKcal: 63, proteinsG: 1 }, NaN).kcal).toBeNull();
  });

  it('nettoie et vérifie un code-barres', () => {
    expect(cleanBarcode('5 060 334-870.123')).toBe('5060334870123');
    expect(isBarcode('5060334870123')).toBe(true);
    expect(isBarcode('123')).toBe(false);
  });

  it('rappelle la valeur d’origine', () => {
    const food = {
      source: 'ciqual',
      name: 'Skyr',
      original: { name: 'Skyr', energyKcal: 65, proteinsG: 10.4 },
    };
    expect(originalSummary(food)).toBe('Valeur d’origine Ciqual : 65 kcal, 10,4 g de protéines.');
    expect(originalSummary({ source: 'ciqual', name: 'x' })).toBe('');
  });
});
