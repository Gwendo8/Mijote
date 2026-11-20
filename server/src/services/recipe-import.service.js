import { safeFetch } from '../integrations/safeFetch.js';
import { HttpError } from '../utils/HttpError.js';
import { parseRecipePage } from '../utils/recipe-schema-org.js';

const MAX_PAGE_BYTES = 2 * 1024 * 1024;

const NO_RECIPE = new HttpError(
  422,
  'Aucune recette trouvée sur cette page : ajoute-la à la main (le lien sera gardé)',
);

function decode(buffer, contentType) {
  const charset = contentType.match(/charset=["']?([\w-]+)/i)?.[1] ?? 'utf-8';
  try {
    return new TextDecoder(charset).decode(buffer);
  } catch {
    return new TextDecoder('utf-8').decode(buffer);
  }
}

// Lit la fiche Recipe (schema.org) d'une page et renvoie un brouillon. Rien n'est enregistré :
// la personne complète (aliments, grammes) puis enregistre avec POST /api/recipes.
export async function importFromUrl(url) {
  const { buffer, contentType, finalUrl } = await safeFetch(url, {
    maxBytes: MAX_PAGE_BYTES,
    accept: 'text/html,application/xhtml+xml',
  });
  if (contentType && !/html|xml/i.test(contentType)) throw NO_RECIPE;

  const draft = parseRecipePage(decode(buffer, contentType), finalUrl);
  if (!draft) throw NO_RECIPE;
  return { ...draft, sourceUrl: url };
}
