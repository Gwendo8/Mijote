import { z } from 'zod';
import { pagination } from './common.schema.js';

const text = (label, max) =>
  z
    .string({ error: `${label} invalide` })
    .trim()
    .max(max, { error: `${label} ne doit pas dépasser ${max} caractères` });

const name = text('Le nom', 255).min(1, { error: 'Le nom est obligatoire' });

// Valeurs pour 100 g. Bornes larges mais réalistes : 100 g d'huile pure font environ 900 kcal.
const kcal = z
  .number({ error: 'Les calories doivent être un nombre' })
  .min(0, { error: 'Les calories ne peuvent pas être négatives' })
  .max(1000, { error: 'Les calories pour 100 g ne peuvent pas dépasser 1000' });
const grams = (label) =>
  z
    .number({ error: `${label} doivent être un nombre` })
    .min(0, { error: `${label} ne peuvent pas être négatifs` })
    .max(100, { error: `${label} pour 100 g ne peuvent pas dépasser 100 g` });
const proteins = grams('Les protéines');
const carbs = grams('Les glucides');
const fats = grams('Les lipides');

// Un champ texte facultatif : vide = pas renseigné
const optionalText = (label, max) =>
  text(label, max)
    .transform((v) => v || null)
    .nullable()
    .optional();

export const searchQuery = z.object({
  q: z
    .string({ error: 'Saisis au moins 2 caractères' })
    .trim()
    .min(2, { error: 'Saisis au moins 2 caractères' })
    .max(100, { error: 'La recherche ne doit pas dépasser 100 caractères' }),
  source: z.enum(['ciqual', 'off', 'user'], { error: 'Source inconnue' }).optional(),
  ...pagination,
});

export const offSearchQuery = z.object({ q: searchQuery.shape.q });

const barcodeCode = z
  .string({ error: 'Le code-barres doit contenir 8 à 14 chiffres' })
  .regex(/^\d{8,14}$/, { error: 'Le code-barres doit contenir 8 à 14 chiffres' });

export const barcodeParams = z.object({ code: barcodeCode });

// Code-barres facultatif d'un aliment perso : vide ou null = pas renseigné
const barcode = z.preprocess((v) => (v === '' ? null : v), barcodeCode.nullable().optional());

export const createFoodBody = z.object({
  name,
  brand: optionalText('La marque', 255),
  category: optionalText('La catégorie', 255),
  barcode,
  energyKcal: kcal,
  proteinsG: proteins.nullable().optional(),
  carbsG: carbs.nullable().optional(),
  fatsG: fats.nullable().optional(),
});

export const updateFoodBody = z
  .object({
    name: name.optional(),
    brand: optionalText('La marque', 255),
    category: optionalText('La catégorie', 255),
    barcode,
    energyKcal: kcal.optional(),
    proteinsG: proteins.nullable().optional(),
    carbsG: carbs.nullable().optional(),
    fatsG: fats.nullable().optional(),
  })
  .refine((v) => Object.values(v).some((value) => value !== undefined), {
    error: 'Rien à modifier',
  });

// Correction de l'admin : champ absent ou null = pas corrigé ; au moins une valeur corrigée
export const correctionBody = z
  .object({
    name: name.nullable().optional(),
    energyKcal: kcal.nullable().optional(),
    proteinsG: proteins.nullable().optional(),
    carbsG: carbs.nullable().optional(),
    fatsG: fats.nullable().optional(),
    note: text('La note', 1000)
      .transform((v) => v || null)
      .nullable()
      .optional(),
  })
  .refine(
    (v) =>
      [v.name, v.energyKcal, v.proteinsG, v.carbsG, v.fatsG].some(
        (x) => x !== undefined && x !== null,
      ),
    { error: 'Indique au moins une valeur à corriger' },
  );
