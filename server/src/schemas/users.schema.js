import { z } from 'zod';

export const searchUsersQuery = z.object({
  q: z
    .string({ error: 'Saisis au moins 2 lettres' })
    .trim()
    .min(2, { error: 'Saisis au moins 2 lettres' })
    .max(100, { error: 'La recherche ne doit pas dépasser 100 caractères' }),
});
