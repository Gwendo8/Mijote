import { describe, expect, it } from 'vitest';
import { computeNutrition } from '../../src/utils/nutrition.js';

const poulet = { energyKcal: '151.00', proteinsG: '29.80', carbsG: '0', fatsG: '3.5' };
const riz = { energyKcal: 130, proteinsG: 2.7, carbsG: 28, fatsG: 0.3 };

const compute = (ingredients, extra = {}) =>
  computeNutrition({ ingredients, servings: 2, ...extra });

describe('computeNutrition', () => {
  it('calcule le total et la part avec grammes / 100 × valeur de l’aliment', () => {
    const result = compute([
      { grams: 200, food: poulet },
      { grams: '100', food: riz },
    ]);
    expect(result.total.calories).toBe(432);
    expect(result.total.proteins).toBe(62.3);
    expect(result.perServing.calories).toBe(216);
    expect(result).toMatchObject({
      caloriesPerServing: 216,
      proteinsPerServing: 31.2,
      caloriesSource: 'computed',
      isComplete: true,
      missingIngredients: 0,
    });
  });

  it('rend « à compléter » (null) un ingrédient sans aliment ou sans grammes', () => {
    const noFood = compute([
      { grams: 100, food: poulet },
      { grams: 50, food: null },
    ]);
    expect(noFood).toMatchObject({
      caloriesPerServing: null,
      proteinsPerServing: null,
      isComplete: false,
      missingIngredients: 1,
    });
    // le total garde ce qui est connu
    expect(noFood.total.calories).toBe(151);

    const noGrams = compute([{ grams: null, food: poulet }]);
    expect(noGrams.caloriesPerServing).toBeNull();
  });

  it('compte un ingrédient négligeable pour 0 sans bloquer le calcul', () => {
    const result = compute([
      { grams: 100, food: poulet },
      { grams: null, food: null, isNegligible: true },
    ]);
    expect(result).toMatchObject({ isComplete: true, caloriesPerServing: 75.5 });
  });

  it('calcule les calories et les protéines séparément', () => {
    const sansProteines = { energyKcal: 100, proteinsG: null };
    const result = compute([{ grams: 100, food: sansProteines }]);
    expect(result.caloriesPerServing).toBe(50);
    expect(result.proteinsPerServing).toBeNull();
    expect(result.isComplete).toBe(true);
    expect(result.proteinsComplete).toBe(false);

    const sansCalories = compute([{ grams: 100, food: { energyKcal: null, proteinsG: 10 } }]);
    expect(sansCalories.caloriesPerServing).toBeNull();
    expect(sansCalories.proteinsPerServing).toBe(5);
  });

  it('utilise la valeur corrigée de l’aliment quand elle existe', () => {
    const corrected = { ...poulet, correction: { energyKcal: '100', proteinsG: null } };
    const result = compute([{ grams: 100, food: corrected }], { servings: 1 });
    expect(result.caloriesPerServing).toBe(100);
    expect(result.proteinsPerServing).toBe(29.8); // pas corrigée : valeur d'origine
  });

  it('la correction à la main remplace le calcul, même incomplet', () => {
    const result = compute([{ grams: null, food: null }], {
      manualCalories: '420.00',
      manualProteins: 0,
    });
    expect(result).toMatchObject({
      caloriesPerServing: 420,
      caloriesSource: 'manual',
      proteinsPerServing: 0,
      proteinsSource: 'manual',
    });
  });
});
