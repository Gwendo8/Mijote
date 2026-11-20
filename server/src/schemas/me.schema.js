import { z } from 'zod';
import { firstName, lastName, email, password } from './auth.schema.js';

const requiredPassword = (message) => z.string({ error: message }).min(1, { error: message });

export const updateMeBody = z
  .object({
    firstName: firstName.optional(),
    lastName: lastName.optional(),
    email: email.optional(),
    currentPassword: z.string().optional(),
  })
  .refine((v) => v.firstName !== undefined || v.lastName !== undefined || v.email !== undefined, {
    error: 'Rien à modifier',
  });

export const changePasswordBody = z.object({
  currentPassword: requiredPassword('Saisis ton mot de passe actuel'),
  newPassword: password,
});

export const deleteMeBody = z.object({ password: requiredPassword('Saisis ton mot de passe') });
