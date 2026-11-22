import { z } from 'zod';

// Texte libre du planning : mêmes règles et mêmes messages que l'API (server/src/schemas/planning.schema.js).
// Les calories sont facultatives : vides, la ligne est comptée « sans calories connues », jamais 0.
export const freeEntrySchema = z.object({
  label: z
    .string()
    .trim()
    .min(1, { error: 'Le titre est obligatoire' })
    .max(255, { error: 'Le titre ne doit pas dépasser 255 caractères' }),
  caloriesManual: z
    .number({ error: 'Les calories sont invalides' })
    .min(0, { error: 'Les calories ne peuvent pas être négatives' })
    .max(99_999, { error: 'Les calories sont trop élevées' })
    .nullable(),
});
