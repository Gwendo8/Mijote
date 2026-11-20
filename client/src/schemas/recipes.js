import { z } from 'zod';
import { parseDecimal } from '../utils/foods.js';

// Mêmes règles et mêmes messages que l'API (server/src/schemas/recipes.schema.js).
const minutes = (label) =>
  z
    .number({ error: `${label} doit être un nombre de minutes` })
    .int({ error: `${label} doit être un nombre entier de minutes` })
    .min(0, { error: `${label} ne peut pas être négatif` })
    .max(100_000, { error: `${label} est trop long` })
    .nullable();

const httpUrl = z
  .string()
  .trim()
  .max(2048, { error: 'L’adresse du lien est trop longue' })
  .refine(
    (value) => {
      try {
        return ['http:', 'https:'].includes(new URL(value).protocol);
      } catch {
        return false;
      }
    },
    { error: 'Adresse du lien invalide : elle doit commencer par http:// ou https://' },
  );

const ingredient = z
  .object({
    label: z
      .string()
      .trim()
      .max(255, { error: 'Le texte de l’ingrédient ne doit pas dépasser 255 caractères' }),
    foodId: z.number().nullable(),
    grams: z
      .number({ error: 'Les grammes doivent être un nombre' })
      .positive({ error: 'Les grammes doivent être supérieurs à 0' })
      .max(100_000, { error: 'Les grammes sont trop élevés' })
      .nullable(),
    isNegligible: z.boolean(),
  })
  .refine((value) => value.label || value.foodId, {
    error: 'Écris l’ingrédient ou choisis un aliment',
    path: ['label'],
  });

// Ce que le formulaire vérifie avant l'envoi (il reçoit déjà des nombres : voir recipeFormValues).
export const recipeFormSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, { error: 'Le titre est obligatoire' })
      .max(255, { error: 'Le titre ne doit pas dépasser 255 caractères' }),
    description: z
      .string()
      .trim()
      .max(5000, { error: 'La description ne doit pas dépasser 5000 caractères' }),
    instructions: z.string().trim().max(50_000, { error: 'Les étapes sont trop longues' }),
    servings: z
      .number({ error: 'Le nombre de parts doit être un nombre' })
      .int({ error: 'Le nombre de parts doit être un nombre entier' })
      .min(1, { error: 'Il faut au moins 1 part' })
      .max(100, { error: 'Pas plus de 100 parts' }),
    prepTimeMinutes: minutes('Le temps de préparation'),
    cookTimeMinutes: minutes('Le temps de cuisson'),
    sourceUrl: httpUrl.or(z.literal('')),
    caloriesPerServingManual: z
      .number({ error: 'Les calories doivent être un nombre' })
      .min(0, { error: 'Les calories ne peuvent pas être négatives' })
      .max(10_000, { error: 'Les calories par part sont trop élevées' })
      .nullable(),
    proteinsPerServingManual: z
      .number({ error: 'Les protéines doivent être un nombre' })
      .min(0, { error: 'Les protéines ne peuvent pas être négatives' })
      .max(1000, { error: 'Les protéines par part sont trop élevées' })
      .nullable(),
    visibility: z.enum(['private', 'shared', 'public']),
    sharedWith: z.array(z.number()),
    ingredients: z.array(ingredient).max(200, { error: 'Pas plus de 200 ingrédients' }),
  })
  .superRefine((body, ctx) => {
    if (body.visibility === 'shared' && body.sharedWith.length === 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['sharedWith'],
        message: 'Choisis au moins une personne pour partager cette recette',
      });
    }
  });

// Texte d'un champ vide → null, sinon nombre (« 15 » ; illisible → NaN, refusé par le schéma).
const optionalNumber = (text) => {
  if (String(text ?? '').trim() === '') return null;
  return parseDecimal(text) ?? Number.NaN;
};

// Idée de plat : au moins un ingrédient relié à un aliment, avec ses grammes (comme l'API).
export const IDEA_NEEDS_FOOD =
  'Une idée de plat doit contenir au moins un aliment avec ses grammes';

// Champs du formulaire (du texte) → valeurs prêtes à vérifier.
export function recipeFormValues(fields, ingredients) {
  return {
    title: fields.title ?? '',
    description: fields.description ?? '',
    instructions: fields.instructions ?? '',
    servings: parseDecimal(fields.servings) ?? Number.NaN,
    prepTimeMinutes: optionalNumber(fields.prepTimeMinutes),
    cookTimeMinutes: optionalNumber(fields.cookTimeMinutes),
    sourceUrl: fields.sourceUrl ?? '',
    caloriesPerServingManual: optionalNumber(fields.caloriesManual),
    proteinsPerServingManual: optionalNumber(fields.proteinsManual),
    visibility: fields.visibility,
    sharedWith: fields.sharedWith,
    ingredients,
  };
}

// Adresse collée pour importer une recette : renvoie le message à afficher, ou '' si elle est correcte.
export function importUrlError(text) {
  const url = String(text ?? '').trim();
  if (url === '') return 'Colle l’adresse d’une page de recette';
  const result = httpUrl.safeParse(url);
  return result.success ? '' : result.error.issues[0].message;
}
