import { z } from 'zod';
import { email } from './auth.schema.js';
import { pagination } from './common.schema.js';

export const listUsersQuery = z.object({
  q: z
    .string()
    .trim()
    .max(100, { error: 'La recherche ne doit pas dépasser 100 caractères' })
    .optional(),
  ...pagination,
});

export const setRoleBody = z.object({
  role: z.enum(['user', 'admin'], { error: 'Le rôle doit être « user » ou « admin »' }),
});

export const inviteBody = z.object({ email });

export const settingsBody = z.object({
  registrationOpen: z.boolean({ error: 'registrationOpen doit être vrai ou faux' }),
});

const tagName = z
  .string({ error: "Le nom de l'étiquette est obligatoire" })
  .trim()
  .min(1, { error: "Le nom de l'étiquette est obligatoire" })
  .max(50, { error: "Le nom de l'étiquette ne doit pas dépasser 50 caractères" });

export const createTagBody = z.object({ name: tagName });

export const updateTagBody = z
  .object({
    name: tagName.optional(),
    position: z
      .number({ error: 'La position doit être un nombre entier' })
      .int({ error: 'La position doit être un nombre entier' })
      .min(0, { error: 'La position ne peut pas être négative' })
      .optional(),
  })
  .refine((v) => v.name !== undefined || v.position !== undefined, { error: 'Rien à modifier' });
