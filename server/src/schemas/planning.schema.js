import { z } from 'zod';
import { isValidDate } from '../utils/dates.js';

const intId = (label) =>
  z
    .number({ error: `${label} invalide` })
    .int({ error: `${label} invalide` })
    .positive({ error: `${label} invalide` });

const date = (label = 'Date') =>
  z.string({ error: `${label} invalide` }).refine(isValidDate, {
    error: `${label} invalide (format AAAA-MM-JJ)`,
  });

const label = z
  .string({ error: 'Le titre est invalide' })
  .trim()
  .min(1, { error: 'Le titre est obligatoire' })
  .max(255, { error: 'Le titre ne doit pas dépasser 255 caractères' });

const servings = z
  .number({ error: 'Le nombre de parts est invalide' })
  .positive({ error: 'Le nombre de parts doit être supérieur à 0' })
  .max(999.99, { error: 'Le nombre de parts est trop grand' });

const calories = z
  .number({ error: 'Les calories sont invalides' })
  .min(0, { error: 'Les calories ne peuvent pas être négatives' })
  .max(99_999, { error: 'Les calories sont trop élevées' });

const slotName = z
  .string({ error: 'Le nom du créneau est invalide' })
  .trim()
  .min(1, { error: 'Le nom du créneau est obligatoire' })
  .max(50, { error: 'Le nom du créneau ne doit pas dépasser 50 caractères' });

// ---------- Semaine ----------

export const weekQuery = z.object({
  week: date('La date de la semaine').optional(),
  userId: z.coerce
    .number({ error: 'Personne invalide' })
    .int({ error: 'Personne invalide' })
    .positive({ error: 'Personne invalide' })
    .optional(),
});

// ---------- Entrées ----------

export const createEntryBody = z
  .object({
    date: date(),
    slotId: intId('Créneau'),
    recipeId: intId('Recette').nullable().optional(),
    label: label.optional(),
    servings: servings.nullable().optional(),
    caloriesManual: calories.nullable().optional(),
  })
  .refine((body) => body.recipeId || body.label, {
    error: 'Choisis une recette ou écris un titre',
    path: ['label'],
  })
  .refine((body) => !(body.recipeId && body.caloriesManual != null), {
    error: 'Les calories se saisissent seulement pour un texte libre',
    path: ['caloriesManual'],
  });

export const updateEntryBody = z
  .object({
    date: date().optional(),
    slotId: intId('Créneau').optional(),
    position: z
      .number({ error: 'Position invalide' })
      .int({ error: 'Position invalide' })
      .min(0, { error: 'Position invalide' })
      .optional(),
    label: label.optional(),
    servings: servings.nullable().optional(),
    caloriesManual: calories.nullable().optional(),
  })
  .refine((body) => Object.keys(body).length > 0, { error: 'Aucune modification demandée' });

// ---------- Créneaux ----------

export const createSlotBody = z.object({ name: slotName });

export const updateSlotBody = z
  .object({
    name: slotName.optional(),
    isHidden: z.boolean({ error: 'Valeur invalide' }).optional(),
    position: z
      .number({ error: 'Position invalide' })
      .int({ error: 'Position invalide' })
      .min(0, { error: 'Position invalide' })
      .optional(),
  })
  .refine((body) => Object.keys(body).length > 0, { error: 'Aucune modification demandée' });

// ---------- Partages ----------

export const createShareBody = z.object({
  userId: intId('Personne').nullable({ error: 'Personne invalide' }),
  weekStart: date('La semaine').nullable({ error: 'La semaine est invalide' }),
});
