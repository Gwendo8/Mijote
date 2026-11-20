import { z } from 'zod';
import { parseDecimal } from '../utils/foods.js';

// Mêmes règles et mêmes messages que l'API (server/src/schemas/foods.schema.js).
const MISSING = 'Indique un nombre, même 0';

const text = (label, max) =>
  z
    .string()
    .trim()
    .max(max, { error: `${label} ne doit pas dépasser ${max} caractères` });

const kcal = z
  .number({ error: MISSING })
  .min(0, { error: 'Les calories ne peuvent pas être négatives' })
  .max(1000, { error: 'Les calories pour 100 g ne peuvent pas dépasser 1000' });

const grams = (label) =>
  z
    .number({ error: MISSING })
    .min(0, { error: `${label} ne peuvent pas être négatifs` })
    .max(100, { error: `${label} pour 100 g ne peuvent pas dépasser 100 g` });

// Le formulaire garde du texte dans ses champs ; ce schéma reçoit déjà des nombres (voir foodFormValues).
export const foodFormSchema = z.object({
  name: text('Le nom', 255).min(1, { error: 'Le nom est obligatoire' }),
  brand: text('La marque', 255),
  energyKcal: kcal,
  proteinsG: grams('Les protéines'),
  carbsG: grams('Les glucides'),
  fatsG: grams('Les lipides'),
  barcode: z
    .string()
    .trim()
    .regex(/^(\d{8,14})?$/, { error: 'Le code-barres doit contenir 8 à 14 chiffres' }),
});

// Texte des champs → valeurs prêtes à vérifier (les nombres écrits « 12,5 » sont lus).
export function foodFormValues(fields) {
  return {
    name: fields.name ?? '',
    brand: fields.brand ?? '',
    energyKcal: parseDecimal(fields.energyKcal),
    proteinsG: parseDecimal(fields.proteinsG),
    carbsG: parseDecimal(fields.carbsG),
    fatsG: parseDecimal(fields.fatsG),
    barcode: (fields.barcode ?? '').replace(/\s/g, ''),
  };
}

// Valeurs corrigées par l'admin : au moins une valeur change ; champs vides = pas corrigé.
export const correctionFieldsSchema = z.object({
  name: text('Le nom', 255),
  energyKcal: kcal.nullable(),
  proteinsG: grams('Les protéines').nullable(),
  carbsG: grams('Les glucides').nullable(),
  fatsG: grams('Les lipides').nullable(),
  note: text('La note', 500),
});
