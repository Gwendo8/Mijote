import { z } from 'zod';

// Pagination : ?page=1&limit=20 (page commence à 1, 50 au plus par page)
export const pagination = {
  page: z.coerce
    .number({ error: 'Numéro de page invalide' })
    .int({ error: 'Numéro de page invalide' })
    .min(1, { error: 'Numéro de page invalide' })
    .default(1),
  limit: z.coerce
    .number({ error: 'Nombre par page invalide' })
    .int({ error: 'Nombre par page invalide' })
    .min(1, { error: 'Nombre par page invalide' })
    .max(50, { error: 'Pas plus de 50 éléments par page' })
    .default(20),
};

export const pageQuery = z.object(pagination);

export const idParams = z.object({
  id: z.coerce
    .number({ error: 'Identifiant invalide' })
    .int({ error: 'Identifiant invalide' })
    .positive({ error: 'Identifiant invalide' }),
});
