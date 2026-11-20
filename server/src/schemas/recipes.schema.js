import { z } from 'zod';
import { pagination } from './common.schema.js';

const text = (label, max) =>
  z
    .string({ error: `${label} invalide` })
    .trim()
    .max(max, { error: `${label} ne doit pas dépasser ${max} caractères` });

// Champ texte facultatif : vide = pas renseigné
const optionalText = (label, max) =>
  text(label, max)
    .transform((v) => v || null)
    .nullable()
    .optional();

const intId = (label) =>
  z
    .number({ error: `${label} invalide` })
    .int({ error: `${label} invalide` })
    .positive({ error: `${label} invalide` });

const minutes = (label) =>
  z
    .number({ error: `${label} doit être un nombre de minutes` })
    .int({ error: `${label} doit être un nombre entier de minutes` })
    .min(0, { error: `${label} ne peut pas être négatif` })
    .max(100_000, { error: `${label} est trop long` })
    .nullable()
    .optional();

const httpUrl = (label) =>
  z
    .string({ error: `${label} invalide` })
    .trim()
    .max(2048, { error: `${label} est trop longue` })
    .refine(
      (value) => {
        try {
          return ['http:', 'https:'].includes(new URL(value).protocol);
        } catch {
          return false;
        }
      },
      { error: `${label} invalide : elle doit commencer par http:// ou https://` },
    );

const ingredient = z
  .object({
    label: optionalText('Le texte de l’ingrédient', 255),
    foodId: intId('Aliment').nullable().optional(),
    grams: z
      .number({ error: 'Les grammes doivent être un nombre' })
      .positive({ error: 'Les grammes doivent être supérieurs à 0' })
      .max(100_000, { error: 'Les grammes sont trop élevés' })
      .nullable()
      .optional(),
    isNegligible: z.boolean({ error: 'Valeur invalide' }).default(false),
  })
  .refine((value) => value.label || value.foodId, {
    error: 'Écris l’ingrédient ou choisis un aliment',
    path: ['label'],
  });

// Contenu d'une recette (création et modification complète)
const content = {
  title: text('Le titre', 255).min(1, { error: 'Le titre est obligatoire' }),
  description: optionalText('La description', 5000),
  instructions: optionalText('Les étapes', 50_000),
  servings: z
    .number({ error: 'Le nombre de parts doit être un nombre' })
    .int({ error: 'Le nombre de parts doit être un nombre entier' })
    .min(1, { error: 'Il faut au moins 1 part' })
    .max(100, { error: 'Pas plus de 100 parts' })
    .default(1),
  prepTimeMinutes: minutes('Le temps de préparation'),
  cookTimeMinutes: minutes('Le temps de cuisson'),
  sourceUrl: httpUrl('L’adresse du lien').nullable().optional(),
  visibility: z
    .enum(['private', 'shared', 'public'], { error: 'Visibilité inconnue' })
    .default('private'),
  sharedWith: z
    .array(intId('Personne'), { error: 'Liste de personnes invalide' })
    .max(100)
    .default([]),
  tagIds: z.array(intId('Étiquette'), { error: 'Liste d’étiquettes invalide' }).max(50).default([]),
  caloriesPerServingManual: z
    .number({ error: 'Les calories doivent être un nombre' })
    .min(0, { error: 'Les calories ne peuvent pas être négatives' })
    .max(10_000, { error: 'Les calories par part sont trop élevées' })
    .nullable()
    .optional(),
  proteinsPerServingManual: z
    .number({ error: 'Les protéines doivent être un nombre' })
    .min(0, { error: 'Les protéines ne peuvent pas être négatives' })
    .max(1000, { error: 'Les protéines par part sont trop élevées' })
    .nullable()
    .optional(),
  ingredients: z
    .array(ingredient, { error: 'Liste d’ingrédients invalide' })
    .max(200, { error: 'Pas plus de 200 ingrédients' }),
};

const needsPeople = (body, ctx) => {
  if (body.visibility === 'shared' && body.sharedWith.length === 0) {
    ctx.addIssue({
      code: 'custom',
      path: ['sharedWith'],
      message: 'Choisis au moins une personne pour partager cette recette',
    });
  }
};

export const createRecipeBody = z
  .object({
    kind: z.enum(['recipe', 'idea'], { error: 'Le type doit être « recipe » ou « idea »' }),
    ...content,
    photoUrl: httpUrl('L’adresse de la photo').nullable().optional(),
  })
  .superRefine(needsPeople);

export const updateRecipeBody = z.object(content).superRefine(needsPeople);

const csvIds = z
  .string({ error: 'Liste d’étiquettes invalide' })
  .regex(/^\d+(,\d+)*$/, { error: 'Liste d’étiquettes invalide' })
  .transform((value) => value.split(',').map(Number));

const numberQuery = (label) =>
  z.coerce.number({ error: `${label} invalide` }).min(0, { error: `${label} invalide` });

export const listRecipesQuery = z.object({
  scope: z.enum(['mine', 'shared', 'public', 'all'], { error: 'Filtre inconnu' }).default('all'),
  kind: z.enum(['recipe', 'idea'], { error: 'Type inconnu' }).optional(),
  q: z
    .string()
    .trim()
    .max(100, { error: 'La recherche ne doit pas dépasser 100 caractères' })
    .optional(),
  tagIds: csvIds.optional(),
  maxCalories: numberQuery('Le maximum de calories').optional(),
  minProteins: numberQuery('Le minimum de protéines').optional(),
  ownerId: z.coerce.number({ error: 'Personne invalide' }).int().positive().optional(),
  sort: z
    .enum(['recent', 'title', 'calories', 'proteins'], { error: 'Tri inconnu' })
    .default('recent'),
  order: z.enum(['asc', 'desc'], { error: 'Ordre inconnu' }).optional(),
  ...pagination,
});

export const importBody = z.object({
  url: httpUrl('L’adresse du lien'),
});
