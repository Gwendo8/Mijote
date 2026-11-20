import { env } from '../config/env.js';
import { HttpError } from '../utils/HttpError.js';
import { normalizeSearchText } from '../utils/text.js';

// Seul endroit qui parle à Open Food Facts (base collaborative de produits, gratuite).
// Les tests n'appellent jamais le vrai service : ils remplacent `fetch`.

const BASE_URL = 'https://world.openfoodfacts.org';
const FIELDS = 'code,product_name,product_name_fr,brands,categories,nutriments';
const TIMEOUT_MS = 8000;

const unavailable = () => new HttpError(502, 'Open Food Facts ne répond pas, réessaie plus tard');

// Limites d'Open Food Facts, par adresse IP (documentation officielle de leur API) :
// 10 recherches et 15 lectures de produit par minute. Tout Mijote passe par l'adresse du serveur :
// ces compteurs sont donc communs à tous les comptes. Au-delà, Open Food Facts peut bannir l'adresse.
// Seuls les vrais appels comptent (un produit déjà en cache ne passe pas ici).
const LIMITS = { search: 10, product: 15 };
const WINDOW_MS = 60 * 1000;
const calls = { search: [], product: [] };

function takeBudget(kind) {
  const now = Date.now();
  calls[kind] = calls[kind].filter((time) => now - time < WINDOW_MS);
  if (calls[kind].length >= LIMITS[kind]) {
    const error = new HttpError(
      429,
      'Open Food Facts est très demandé en ce moment, réessaie dans une minute',
    );
    // Secondes avant qu'une place se libère (envoyé dans l'en-tête Retry-After)
    error.retryAfter = Math.max(1, Math.ceil((calls[kind][0] + WINDOW_MS - now) / 1000));
    throw error;
  }
  calls[kind].push(now);
}

// Pour les tests : remet les compteurs à zéro.
export function resetOffBudget() {
  calls.search = [];
  calls.product = [];
}

async function getJson(url) {
  let response;
  try {
    response = await fetch(url, {
      headers: { 'user-agent': env.OFF_USER_AGENT, accept: 'application/json' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    throw unavailable();
  }
  if (response.status === 404) return null;
  // 503 : Open Food Facts limite tout le monde quand il est surchargé (limites globales de leur API)
  if (response.status === 503) {
    throw new HttpError(
      502,
      'Open Food Facts est surchargé pour le moment, réessaie dans un instant',
    );
  }
  if (!response.ok) throw unavailable();
  try {
    return await response.json();
  } catch {
    throw unavailable();
  }
}

// Valeur pour 100 g : un nombre raisonnable, sinon « inconnue » (Open Food Facts contient parfois des erreurs de saisie)
function amount(value, max) {
  if (value === undefined || value === null || value === '') return null;
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0 || number > max) return null;
  return Math.round(number * 100) / 100;
}

// Énergie : `energy-kcal_100g`, sinon `energy_100g` (en kJ) divisé par 4,184
function energyKcal(nutriments) {
  const kcal = amount(nutriments['energy-kcal_100g'], 1000);
  if (kcal !== null) return kcal;
  const kj = amount(nutriments.energy_100g, 5000);
  return kj === null ? null : Math.round((kj / 4.184) * 100) / 100;
}

// Produit Open Food Facts → champs de la table foods. null si le produit n'a pas de nom exploitable.
export function toFoodData(product) {
  const barcode = String(product?.code ?? '').trim();
  const name = String(product?.product_name_fr || product?.product_name || '')
    .trim()
    .slice(0, 255);
  if (!/^\d{4,32}$/.test(barcode) || !name) return null;

  const nutriments = product.nutriments ?? {};
  const brand = String(product.brands ?? '')
    .split(',')[0]
    .trim();
  // `categories` est une liste séparée par des virgules, de la plus générale à la plus précise
  const category = String(product.categories ?? '')
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean)
    .at(-1);

  return {
    barcode,
    name,
    searchName: normalizeSearchText(name),
    brand: brand ? brand.slice(0, 255) : null,
    category: category ? category.slice(0, 255) : null,
    energyKcal: energyKcal(nutriments),
    proteinsG: amount(nutriments.proteins_100g, 100),
    carbsG: amount(nutriments.carbohydrates_100g, 100),
    fatsG: amount(nutriments.fat_100g, 100),
    fetchedAt: new Date(),
  };
}

// Un produit par code-barres : null s'il n'existe pas, 502 si le service ne répond pas.
export async function fetchProduct(barcode) {
  takeBudget('product');
  const body = await getJson(
    `${BASE_URL}/api/v2/product/${encodeURIComponent(barcode)}.json?fields=${FIELDS}`,
  );
  if (!body || body.status === 0 || !body.product) return null;
  return toFoodData(body.product);
}

// Recherche par mots : jusqu'à 20 produits.
export async function searchProducts(q) {
  takeBudget('search');
  const params = new URLSearchParams({
    search_terms: q,
    search_simple: '1',
    action: 'process',
    json: '1',
    page_size: '20',
    fields: FIELDS,
  });
  const body = await getJson(`${BASE_URL}/cgi/search.pl?${params}`);
  if (!body) throw unavailable();
  return (body.products ?? []).map(toFoodData).filter(Boolean);
}
