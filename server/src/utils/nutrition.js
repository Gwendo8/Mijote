// Calories et protéines d'une recette : calculées à chaque lecture, jamais stockées
// (seule la correction à la main, par part, est gardée en base).

const round1 = (value) => Math.round(value * 10) / 10;
const toNumber = (value) => (value === null || value === undefined ? null : Number(value));

// Valeur effective d'un aliment : la correction de l'admin si elle existe, sinon la valeur d'origine.
// Un aliment archivé compte toujours (les recettes qui l'utilisent gardent leurs calories).
export function effectiveFoodValues(food) {
  const pick = (field) => toNumber(food.correction?.[field] ?? food[field]);
  return {
    kcal: pick('energyKcal'),
    proteins: pick('proteinsG'),
    carbs: pick('carbsG'),
    fats: pick('fatsG'),
  };
}

// ingredients : [{ grams, isNegligible, food }] (food avec sa correction éventuelle, ou null)
// Un ingrédient « négligeable » compte pour 0. Tout autre ingrédient sans aliment, sans grammes
// ou dont l'aliment ne donne pas la valeur est « à compléter » pour cette valeur.
// Les calories et les protéines se jugent séparément : un aliment sans protéines ne bloque pas les calories.
export function computeNutrition({ ingredients, servings, manualCalories, manualProteins }) {
  const total = { calories: 0, proteins: 0, carbs: 0, fats: 0 };
  let caloriesMissing = 0;
  let proteinsMissing = 0;
  let missingIngredients = 0; // ingrédients à compléter pour les calories (ou sans aliment ni grammes)

  for (const ingredient of ingredients) {
    if (ingredient.isNegligible) continue;
    const grams = toNumber(ingredient.grams);
    if (!ingredient.food || !grams) {
      caloriesMissing += 1;
      proteinsMissing += 1;
      missingIngredients += 1;
      continue;
    }
    const values = effectiveFoodValues(ingredient.food);
    const factor = grams / 100;
    if (values.kcal === null) {
      caloriesMissing += 1;
      missingIngredients += 1;
    } else {
      total.calories += factor * values.kcal;
    }
    if (values.proteins === null) proteinsMissing += 1;
    else total.proteins += factor * values.proteins;
    total.carbs += factor * (values.carbs ?? 0);
    total.fats += factor * (values.fats ?? 0);
  }

  const parts = Math.max(1, servings);
  const perServing = {
    calories: round1(total.calories / parts),
    proteins: round1(total.proteins / parts),
    carbs: round1(total.carbs / parts),
    fats: round1(total.fats / parts),
  };

  const manualKcal = toNumber(manualCalories);
  const manualProt = toNumber(manualProteins);
  const caloriesComplete = caloriesMissing === 0;
  const proteinsComplete = proteinsMissing === 0;

  // Valeur à afficher : la correction à la main si elle existe, sinon le calcul s'il est complet, sinon « à compléter »
  const shown = (manual, complete, computed) =>
    manual !== null
      ? { value: round1(manual), source: 'manual' }
      : complete
        ? { value: computed, source: 'computed' }
        : { value: null, source: null };
  const calories = shown(manualKcal, caloriesComplete, perServing.calories);
  const proteins = shown(manualProt, proteinsComplete, perServing.proteins);

  return {
    caloriesPerServing: calories.value,
    proteinsPerServing: proteins.value,
    caloriesSource: calories.source,
    proteinsSource: proteins.source,
    isComplete: caloriesComplete,
    proteinsComplete,
    missingIngredients,
    total: {
      calories: round1(total.calories),
      proteins: round1(total.proteins),
      carbs: round1(total.carbs),
      fats: round1(total.fats),
    },
    perServing,
  };
}
