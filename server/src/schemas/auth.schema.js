import { z } from 'zod';

// Règle de mot de passe (la même que Platine) : au moins 8 caractères, un chiffre et un caractère spécial
// (tout ce qui n'est ni une lettre ni un chiffre). Un message par règle.
export const password = z
  .string({ error: 'Saisis un mot de passe' })
  .min(8, { error: 'Le mot de passe doit contenir au moins 8 caractères' })
  .max(128, { error: 'Le mot de passe ne doit pas dépasser 128 caractères' })
  .regex(/\p{N}/u, { error: 'Le mot de passe doit contenir au moins un chiffre' })
  .regex(/[^\p{L}\p{N}]/u, {
    error: 'Le mot de passe doit contenir au moins un caractère spécial (ex. ! ? - #)',
  });

export const email = z
  .string({ error: 'Saisis ton adresse e-mail' })
  .trim()
  .toLowerCase()
  .pipe(
    z.email({ error: 'Adresse e-mail invalide' }).max(255, { error: 'Adresse e-mail trop longue' }),
  );

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

// Jeton reçu dans un lien (base64url, 43 caractères)
const token = z.string().regex(/^[A-Za-z0-9_-]{20,100}$/, { error: "Ce lien n'est plus valable" });

export const tokenParams = z.object({ token });

export const loginBody = z.object({
  email,
  // À la connexion, on ne rappelle pas la règle : seulement « saisis-le »
  password: z
    .string({ error: 'Saisis ton mot de passe' })
    .min(1, { error: 'Saisis ton mot de passe' }),
});

// Avec un jeton d'invitation, l'e-mail est celui de l'invitation : le champ reçu est ignoré.
export const registerBody = z
  .object({ token: token.optional(), email: email.optional(), password, firstName, lastName })
  .refine((v) => v.token || v.email, { error: 'Saisis ton adresse e-mail', path: ['email'] });

export const forgotPasswordBody = z.object({ email });

export const resetPasswordBody = z.object({ token, password });
