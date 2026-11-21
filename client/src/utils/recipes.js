// Petits outils d'affichage et de calcul des recettes (et des idées de plats, qui ont la même forme).
import { ApiError } from '../services/api.js';
import { formatNombre, parseDecimal } from './foods.js';

// Durée en minutes → « 35 min », « 1 h 10 ».
export function formatMinutes(minutes) {
  if (minutes === null || minutes === undefined) return '';
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} h` : `${h} h ${String(m).padStart(2, '0')}`;
}

export const totalMinutes = (recipe) =>
  (recipe.prepTimeMinutes ?? 0) + (recipe.cookTimeMinutes ?? 0);

export const formatParts = (servings) => `${servings} ${servings > 1 ? 'parts' : 'part'}`;

// Sous le titre d'une étiquette : « 35 min, 2 parts » (+ « , de Léa » pour la recette d'une autre personne).
export function detailEtiquette(recipe, auteur) {
  const total = totalMinutes(recipe);
  return [
    total > 0 ? formatMinutes(total) : null,
    formatParts(recipe.servings),
    auteur && `de ${auteur}`,
  ]
    .filter(Boolean)
    .join(', ');
}

// Sous le titre d'une fiche : « 15 min + 20 min de cuisson ».
export function detailTemps(recipe) {
  const prep = recipe.prepTimeMinutes;
  const cuisson = recipe.cookTimeMinutes;
  if (prep && cuisson) return `${formatMinutes(prep)} + ${formatMinutes(cuisson)} de cuisson`;
  if (prep) return `${formatMinutes(prep)} de préparation`;
  if (cuisson) return `${formatMinutes(cuisson)} de cuisson`;
  return '';
}

// Les étapes sont stockées une par ligne.
export const splitSteps = (instructions) =>
  String(instructions ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

// Étapes du formulaire : une ligne de texte par étape, chacune avec une clé pour React.
export const emptyStep = (text = '') => ({ key: newKey(), text });
export const stepsFromText = (instructions) => splitSteps(instructions).map(emptyStep);
// Une étape ne contient jamais de retour à la ligne (l'API stocke une étape par ligne).
export const oneLine = (text) => String(text ?? '').replace(/\s*[\r\n]+\s*/g, ' ');
// Étapes → texte de l'API : les étapes vides sont ignorées.
export const stepsToText = (steps) =>
  steps
    .map((step) => oneLine(step.text).trim())
    .filter(Boolean)
    .join('\n');

// Quantités pour un autre nombre de parts. Les grammes suivent ; un nombre au début du texte
// (« 4 œufs », « 500 g de poulet ») suit aussi, sauf s'il est suivi d'une fraction ou d'une plage (« 1/2 », « 2 à 3 »).
export const scaleGrams = (grams, factor) =>
  grams === null || grams === undefined ? null : Math.round(grams * factor * 10) / 10;

export function scaleLabel(label, factor) {
  if (factor === 1) return label;
  const match = /^(\d+(?:[.,]\d+)?)(?![\d/.,]|\s*(?:à|a|-|–|\/))/.exec(label);
  if (!match) return label;
  const value = Number(match[1].replace(',', '.')) * factor;
  const rounded = Math.round(value * 10) / 10;
  return `${formatNombre(rounded)}${label.slice(match[0].length)}`;
}

// Ce que dit la ligne « PAR PART » : la valeur affichée par l'API (correction à la main, ou calcul complet),
// sinon le calcul partiel avec la mention « à compléter ».
export function nutritionView(nutrition) {
  const per = nutrition?.perServing ?? null;
  const kcal = nutrition?.caloriesPerServing ?? null;
  const proteins = nutrition?.proteinsPerServing ?? null;
  return {
    kcal,
    proteins,
    manual: nutrition?.caloriesSource === 'manual',
    complete: Boolean(nutrition?.isComplete),
    missing: nutrition?.missingIngredients ?? 0,
    partialKcal: kcal === null && per && per.calories > 0 ? per.calories : null,
    macros: per ? { proteins: per.proteins, carbs: per.carbs, fats: per.fats } : {},
  };
}

// Même règle que le serveur (API.md § 5) pour montrer le calcul pendant la saisie :
// un ingrédient avec aliment et grammes compte, « négligeable » compte 0, tout le reste est « à compléter ».
export function computeNutrition(rows, servings) {
  const total = { calories: 0, proteins: 0, carbs: 0, fats: 0 };
  let missing = 0;
  let proteinsMissing = 0;
  for (const row of rows) {
    if (row.isNegligible) continue;
    const grams = parseDecimal(row.gramsText);
    const food = row.food;
    if (!food || grams === null || grams <= 0 || food.energyKcal === null) {
      missing += 1;
      proteinsMissing += 1;
      continue;
    }
    const factor = grams / 100;
    total.calories += food.energyKcal * factor;
    total.carbs += (food.carbsG ?? 0) * factor;
    total.fats += (food.fatsG ?? 0) * factor;
    if (food.proteinsG === null) proteinsMissing += 1;
    else total.proteins += food.proteinsG * factor;
  }
  const parts = Math.max(1, Number(servings) || 1);
  const round = (n) => Math.round((n / parts) * 10) / 10;
  return {
    missing,
    proteinsMissing,
    known: rows.some((row) => !row.isNegligible),
    perServing: {
      calories: round(total.calories),
      proteins: round(total.proteins),
      carbs: round(total.carbs),
      fats: round(total.fats),
    },
  };
}

let nextKey = 1;
export const newKey = () => `ing-${nextKey++}`;

// Ligne d'ingrédient du formulaire (les grammes restent du texte pendant la saisie).
export function emptyRow(values = {}) {
  return {
    key: newKey(),
    label: '',
    food: null,
    gramsText: '',
    isNegligible: false,
    ...values,
  };
}

// Ingrédient de l'API → ligne du formulaire.
export const rowFromIngredient = (ingredient) =>
  emptyRow({
    label: ingredient.label ?? '',
    food: ingredient.food ?? null,
    gramsText: ingredient.grams === null ? '' : String(ingredient.grams).replace('.', ','),
    isNegligible: ingredient.isNegligible,
  });

// Brouillon d'un import (`{ label }` par ingrédient) → lignes du formulaire.
export const rowsFromDraft = (ingredients) =>
  (ingredients ?? []).map((ingredient) => emptyRow({ label: ingredient.label ?? '' }));

// Ligne du formulaire → ingrédient du corps de l'API.
export function ingredientBody(row) {
  // Vide = pas de grammes ; un texte illisible devient NaN, refusé par le schéma avec un message clair
  const grams = row.gramsText.trim() === '' ? null : (parseDecimal(row.gramsText) ?? Number.NaN);
  return {
    label: row.label.trim(),
    foodId: row.food?.id ?? null,
    grams,
    isNegligible: row.isNegligible,
  };
}

// Une recette lue → corps complet pour `PUT /recipes/:id` (l'API remplace tout le contenu).
// Sert au partage : on renvoie la recette telle qu'elle est, avec la nouvelle visibilité.
export function recipeToBody(recipe, changes = {}) {
  return {
    title: recipe.title,
    description: recipe.description ?? null,
    instructions: recipe.instructions ?? null,
    servings: recipe.servings,
    prepTimeMinutes: recipe.prepTimeMinutes ?? null,
    cookTimeMinutes: recipe.cookTimeMinutes ?? null,
    sourceUrl: recipe.sourceUrl ?? null,
    visibility: recipe.visibility,
    sharedWith: (recipe.sharedWith ?? []).map((person) => person.id),
    tagIds: recipe.tags.map((tag) => tag.id),
    caloriesPerServingManual: recipe.caloriesPerServingManual ?? null,
    proteinsPerServingManual: recipe.proteinsPerServingManual ?? null,
    ingredients: recipe.ingredients.map((ingredient) => ({
      label: ingredient.label || undefined,
      foodId: ingredient.food?.id ?? null,
      grams: ingredient.grams ?? null,
      isNegligible: ingredient.isNegligible,
    })),
    ...changes,
  };
}

export const VISIBILITES = [
  { id: 'private', titre: 'Moi seulement', detail: 'recette privée' },
  { id: 'shared', titre: 'Des personnes choisies', detail: null },
  { id: 'public', titre: 'Tout le monde', detail: 'tous les comptes de Mijote' },
];

export const visibiliteLabel = (visibility) =>
  ({ private: 'moi seulement', shared: 'des personnes choisies', public: 'tout le monde' })[
    visibility
  ] ?? visibility;

// Sources de la liste (« filtre de portée » de l'API).
export const PORTEES = [
  { id: 'all', label: 'Tout' },
  { id: 'mine', label: 'Mes recettes' },
  { id: 'shared', label: 'Partagées avec moi' },
  { id: 'public', label: 'Publiques' },
];

// Adresse du site d'où vient une recette : « cuisine-facile.fr ».
export function siteOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

// ----- Photo : l'API lit JPEG, PNG et WebP (pas toujours HEIC, le format des iPhone) -----
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 8 * 1024 * 1024;
const MAX_SIDE = 2000;

// Renvoie un fichier que le serveur sait lire : le même s'il est déjà JPEG, PNG ou WebP et pas trop lourd,
// sinon une copie en JPEG faite avec un canvas. Lance une Error en français si l'image est illisible.
export async function prepareImage(file) {
  if (ACCEPTED.includes(file.type) && file.size <= MAX_BYTES) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close?.();
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.88));
    if (!blob) throw new Error('vide');
    return new File([blob], 'photo.jpg', { type: 'image/jpeg' });
  } catch {
    throw new ApiError(400, 'Cette photo n’est pas lisible. Choisis une image JPEG, PNG ou WebP.');
  }
}
