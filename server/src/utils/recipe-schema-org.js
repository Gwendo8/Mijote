import { parse } from 'node-html-parser';

// Lecture de la fiche « Recipe » (schema.org, format JSON-LD) que la plupart des sites de cuisine
// placent dans leurs pages. Pas d'IA : on lit ce que le site a déjà structuré.

// Texte brut : retire les balises et décode les entités (&amp;, &#39;...)
const plain = (value) => (typeof value === 'string' ? parse(value).text.trim() : '');
const asArray = (value) => (Array.isArray(value) ? value : value === undefined ? [] : [value]);

// « PT1H30M » → 90 (minutes) ; null si absent ou illisible
export function parseDuration(value) {
  if (typeof value !== 'string') return null;
  const match = value.trim().match(/^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/i);
  if (!match) return null;
  const [, days = 0, hours = 0, minutes = 0, seconds = 0] = match;
  const total = days * 1440 + hours * 60 + Number(minutes) + Math.round(seconds / 60);
  return total > 0 ? total : null;
}

// « 4 personnes », 4, ["4", "4 parts"] → 4 (premier nombre trouvé), sinon 1
export function parseServings(value) {
  for (const item of asArray(value)) {
    const match = String(item).match(/\d+/);
    if (match) return Math.min(100, Math.max(1, Number(match[0])));
  }
  return 1;
}

// Étapes : texte, liste de textes, HowToStep { text } ou HowToSection { itemListElement } → une par ligne
function instructionLines(value) {
  if (typeof value === 'string') {
    return plain(value)
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  }
  return asArray(value).flatMap((item) => {
    if (typeof item === 'string') return instructionLines(item);
    if (item?.itemListElement) return instructionLines(item.itemListElement);
    return instructionLines(item?.text ?? item?.name ?? '');
  });
}

function imageUrl(value, pageUrl) {
  const first = asArray(value)[0];
  const raw = typeof first === 'string' ? first : (first?.url ?? first?.contentUrl);
  if (typeof raw !== 'string') return null;
  try {
    const url = new URL(raw, pageUrl);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

// Cherche un objet de type Recipe dans un bloc JSON-LD (liste, @graph, objets imbriqués)
function findRecipe(node) {
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findRecipe(item);
      if (found) return found;
    }
    return null;
  }
  if (!node || typeof node !== 'object') return null;
  if (asArray(node['@type']).includes('Recipe')) return node;
  return findRecipe(node['@graph']);
}

// Renvoie le brouillon de recette, ou null si la page n'a pas de fiche Recipe
export function parseRecipePage(html, pageUrl) {
  const scripts = parse(html).querySelectorAll('script[type="application/ld+json"]');
  for (const script of scripts) {
    let data;
    try {
      data = JSON.parse(script.textContent);
    } catch {
      continue; // bloc mal formé : on essaie les suivants
    }
    const recipe = findRecipe(data);
    if (!recipe) continue;

    return {
      title: (plain(recipe.name) || new URL(pageUrl).hostname).slice(0, 255),
      description: plain(recipe.description) || null,
      instructions: instructionLines(recipe.recipeInstructions).join('\n') || null,
      servings: parseServings(recipe.recipeYield),
      prepTimeMinutes: parseDuration(recipe.prepTime),
      cookTimeMinutes: parseDuration(recipe.cookTime),
      sourceUrl: pageUrl,
      imageUrl: imageUrl(recipe.image, pageUrl),
      ingredients: asArray(recipe.recipeIngredient)
        .map((item) => plain(String(item)).slice(0, 255))
        .filter(Boolean)
        .map((label) => ({ label })),
    };
  }
  return null;
}
