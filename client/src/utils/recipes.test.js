import { describe, expect, it } from 'vitest';
import { ApiError } from '../services/api.js';
import {
  computeNutrition,
  detailEtiquette,
  detailTemps,
  emptyRow,
  formatMinutes,
  ingredientBody,
  nutritionView,
  oneLine,
  prepareImage,
  stepsFromText,
  stepsToText,
  recipeToBody,
  scaleGrams,
  scaleLabel,
  siteOf,
  splitSteps,
} from './recipes.js';

describe('durées et textes', () => {
  it('écrit les durées', () => {
    expect(formatMinutes(35)).toBe('35 min');
    expect(formatMinutes(70)).toBe('1 h 10');
    expect(formatMinutes(120)).toBe('2 h');
    expect(formatMinutes(null)).toBe('');
  });
  it('détaille une étiquette et une fiche', () => {
    expect(detailEtiquette({ prepTimeMinutes: 15, cookTimeMinutes: 20, servings: 2 })).toBe(
      '35 min, 2 parts',
    );
    expect(
      detailEtiquette({ prepTimeMinutes: null, cookTimeMinutes: null, servings: 1 }, 'Léa'),
    ).toBe('1 part, de Léa');
    expect(detailTemps({ prepTimeMinutes: 15, cookTimeMinutes: 20 })).toBe(
      '15 min + 20 min de cuisson',
    );
    expect(detailTemps({ prepTimeMinutes: 5, cookTimeMinutes: null })).toBe('5 min de préparation');
    expect(detailTemps({ prepTimeMinutes: null, cookTimeMinutes: null })).toBe('');
  });
  it('découpe les étapes, une par ligne, sans lignes vides', () => {
    expect(splitSteps('Couper.\n\n  Cuire.  \n')).toEqual(['Couper.', 'Cuire.']);
    expect(splitSteps(null)).toEqual([]);
  });
  it('donne le site d’une adresse', () => {
    expect(siteOf('https://www.cuisine-facile.fr/a')).toBe('cuisine-facile.fr');
    expect(siteOf('pas une adresse')).toBe('');
  });
});

describe('parts', () => {
  it('fait suivre les grammes', () => {
    expect(scaleGrams(200, 1.5)).toBe(300);
    expect(scaleGrams(null, 2)).toBeNull();
  });
  it('fait suivre le nombre au début du texte', () => {
    expect(scaleLabel('4 œufs', 2)).toBe('8 œufs');
    expect(scaleLabel('500 g de poulet', 0.5)).toBe('250 g de poulet');
    expect(scaleLabel('3 oignons', 1.5)).toBe('4,5 oignons');
  });
  it('laisse tel quel un texte sans nombre, une fraction ou une plage', () => {
    expect(scaleLabel('huile d’olive', 2)).toBe('huile d’olive');
    expect(scaleLabel('1/2 citron', 2)).toBe('1/2 citron');
    expect(scaleLabel('2 à 3 citrons', 2)).toBe('2 à 3 citrons');
    expect(scaleLabel('4 œufs', 1)).toBe('4 œufs');
  });
});

describe('nutritionView', () => {
  it('prend la valeur affichée par l’API, ou le calcul partiel', () => {
    const complet = nutritionView({
      caloriesPerServing: 270,
      proteinsPerServing: 17,
      isComplete: true,
    });
    expect(complet.kcal).toBe(270);
    const partiel = nutritionView({
      caloriesPerServing: null,
      proteinsPerServing: null,
      isComplete: false,
      missingIngredients: 1,
      perServing: { calories: 188.8, proteins: 37.3, carbs: 0, fats: 4.4 },
    });
    expect(partiel.kcal).toBeNull();
    expect(partiel.partialKcal).toBe(188.8);
    expect(partiel.missing).toBe(1);
  });
});

describe('computeNutrition (même règle que le serveur)', () => {
  const food = { energyKcal: 140, proteinsG: 12, carbsG: 1, fatsG: 10 };
  it('additionne les ingrédients reliés avec des grammes et divise par les parts', () => {
    const calcul = computeNutrition([emptyRow({ food, gramsText: '200' })], '2');
    expect(calcul.perServing.calories).toBe(140);
    expect(calcul.perServing.proteins).toBe(12);
    expect(calcul.missing).toBe(0);
  });
  it('compte « à compléter » un ingrédient sans aliment ou sans grammes, et 0 un négligeable', () => {
    const calcul = computeNutrition(
      [
        emptyRow({ food, gramsText: '100' }),
        emptyRow({ label: 'poivron' }),
        emptyRow({ food, gramsText: '' }),
        emptyRow({ label: 'sel', isNegligible: true }),
      ],
      1,
    );
    expect(calcul.missing).toBe(2);
    expect(calcul.perServing.calories).toBe(140);
  });
  it('protéines inconnues : on le sait', () => {
    const calcul = computeNutrition(
      [emptyRow({ food: { ...food, proteinsG: null }, gramsText: '100' })],
      1,
    );
    expect(calcul.proteinsMissing).toBe(1);
  });
});

describe('corps pour l’API', () => {
  it('ingredientBody lit les grammes écrits « 12,5 » et refuse un texte illisible', () => {
    expect(ingredientBody(emptyRow({ label: ' riz ', gramsText: '12,5' }))).toMatchObject({
      label: 'riz',
      grams: 12.5,
      foodId: null,
    });
    expect(ingredientBody(emptyRow({ label: 'riz', gramsText: '' })).grams).toBeNull();
    expect(ingredientBody(emptyRow({ label: 'riz', gramsText: 'beaucoup' })).grams).toBeNaN();
  });
  it('recipeToBody renvoie tout le contenu, avec les changements demandés', () => {
    const recipe = {
      title: 'Soupe',
      description: null,
      instructions: 'Cuire.',
      servings: 2,
      prepTimeMinutes: 5,
      cookTimeMinutes: null,
      sourceUrl: null,
      visibility: 'private',
      sharedWith: [{ id: 5 }],
      tags: [{ id: 1 }],
      caloriesPerServingManual: null,
      proteinsPerServingManual: null,
      ingredients: [
        { label: '2 carottes', grams: 200, isNegligible: false, food: { id: 9 } },
        { label: 'sel', grams: null, isNegligible: true, food: null },
      ],
    };
    const body = recipeToBody(recipe, { visibility: 'public', sharedWith: [] });
    expect(body).toMatchObject({
      title: 'Soupe',
      visibility: 'public',
      sharedWith: [],
      tagIds: [1],
      ingredients: [
        { label: '2 carottes', foodId: 9, grams: 200, isNegligible: false },
        { label: 'sel', foodId: null, grams: null, isNegligible: true },
      ],
    });
    expect(body.kind).toBeUndefined();
  });
});

describe('prepareImage', () => {
  it('garde une photo déjà lisible par le serveur', async () => {
    const file = new File(['abc'], 'p.png', { type: 'image/png' });
    expect(await prepareImage(file)).toBe(file);
  });
  it('dit clairement quand une photo (HEIC…) ne peut pas être convertie', async () => {
    const file = new File(['abc'], 'p.heic', { type: 'image/heic' });
    const error = await prepareImage(file).catch((e) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error.message).toMatch(/JPEG, PNG ou WebP/);
  });
});

describe('étapes du formulaire', () => {
  it('découpe par ligne en ignorant les lignes vides', () => {
    expect(stepsFromText('a\n\n  b  \n').map((s) => s.text)).toEqual(['a', 'b']);
    expect(stepsFromText(null)).toEqual([]);
  });
  it('recolle avec des retours à la ligne, sans les étapes vides', () => {
    const steps = [{ text: 'a' }, { text: '   ' }, { text: 'b\nc' }];
    expect(stepsToText(steps)).toBe('a\nb c');
  });
  it('remplace les retours à la ligne par une espace', () => {
    expect(oneLine('a\r\n b\nc')).toBe('a b c');
  });
});
