import { z } from 'zod';

// Mêmes règles et mêmes messages que l'API (server/src/schemas/auth.schema.js) :
// on évite un aller-retour au serveur pour une faute de frappe, et le message est identique.
export const email = z
  .string({ error: 'Saisis ton adresse e-mail' })
  .trim()
  .min(1, { error: 'Saisis ton adresse e-mail' })
  .pipe(
    z.email({ error: 'Adresse e-mail invalide' }).max(255, { error: 'Adresse e-mail trop longue' }),
  );

export const newPassword = z
  .string({ error: 'Saisis un mot de passe' })
  .min(8, { error: 'Le mot de passe doit contenir au moins 8 caractères' })
  .max(128, { error: 'Le mot de passe ne doit pas dépasser 128 caractères' })
  .regex(/\p{N}/u, { error: 'Le mot de passe doit contenir au moins un chiffre' })
  .regex(/[^\p{L}\p{N}]/u, {
    error: 'Le mot de passe doit contenir au moins un caractère spécial (ex. ! ? - #)',
  });

export const firstName = z
  .string({ error: 'Le prénom est obligatoire' })
  .trim()
  .min(1, { error: 'Le prénom est obligatoire' })
  .max(100, { error: 'Le prénom ne doit pas dépasser 100 caractères' });

export const lastName = z
  .string({ error: 'Le nom est obligatoire' })
  .trim()
  .min(1, { error: 'Le nom est obligatoire' })
  .max(100, { error: 'Le nom ne doit pas dépasser 100 caractères' });

const required = (message) => z.string({ error: message }).min(1, { error: message });

export const loginSchema = z.object({ email, password: required('Saisis ton mot de passe') });
export const registerSchema = z.object({ firstName, lastName, email, password: newPassword });
export const forgotPasswordSchema = z.object({ email });
export const resetPasswordSchema = z.object({ password: newPassword });
export const changePasswordSchema = z.object({
  currentPassword: required('Saisis ton mot de passe actuel'),
  newPassword,
});
export const deleteAccountSchema = z.object({ password: required('Saisis ton mot de passe') });
