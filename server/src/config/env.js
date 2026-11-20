import { z } from 'zod';

// Variables d'environnement vérifiées au démarrage : on s'arrête tout de suite si l'une manque.
const schema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(3000),
    DATABASE_URL: z.url(),
    CORS_ORIGIN: z.string().default('http://localhost:5173'),

    // Adresse du front, utilisée pour construire les liens envoyés par e-mail
    APP_URL: z.url().default('http://localhost:5173'),

    // E-mails : sans clé Brevo, les e-mails sont affichés dans le terminal (développement, tests)
    BREVO_API_KEY: z.string().optional(),
    MAIL_FROM_EMAIL: z.string().optional(),
    MAIL_FROM_NAME: z.string().default('Mijote'),
  })
  // En production, les e-mails doivent vraiment partir (invitations, mot de passe oublié)
  .refine((v) => v.NODE_ENV !== 'production' || (v.BREVO_API_KEY && v.MAIL_FROM_EMAIL), {
    message: 'BREVO_API_KEY et MAIL_FROM_EMAIL sont obligatoires en production',
    path: ['BREVO_API_KEY'],
  });

const result = schema.safeParse(process.env);

if (!result.success) {
  throw new Error(
    `Variables d'environnement invalides (voir .env.example) :\n${z.prettifyError(result.error)}`,
  );
}

export const env = result.data;
