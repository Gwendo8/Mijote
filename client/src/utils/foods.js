// Petits outils d'affichage et de saisie des aliments (valeurs pour 100 g).

export const SOURCE_LABELS = { ciqual: 'Ciqual', off: 'Open Food Facts', user: 'Mon aliment' };

// Les puces de la recherche (id = filtre du hook useFoodSearch).
export const FILTRES = [
  { id: 'all', label: 'Tout' },
  { id: 'ciqual', label: 'Ciqual' },
  { id: 'off', label: 'Produits' },
  { id: 'user', label: 'Mes aliments' },
];

export const sourceLabel = (source) => SOURCE_LABELS[source] ?? source;

// Nombre à la française : « 0,2 », « 16,5 » ; une valeur inconnue (null) s'écrit « — ».
export function formatNombre(value, maxDecimals = 1) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: maxDecimals }).format(value);
}

export const formatGrammes = (value) =>
  value === null || value === undefined ? '—' : `${formatNombre(value)} g`;
export const formatKcal = (value) =>
  value === null || value === undefined ? '—' : `${formatNombre(value, 0)} kcal`;

// Texte saisi → nombre. « 12,5 » et « 12.5 » marchent ; vide ou illisible → null.
export function parseDecimal(text) {
  const clean = String(text ?? '')
    .trim()
    .replace(/\s/g, '')
    .replace(',', '.');
  if (clean === '' || !/^\d*\.?\d+$|^\d+\.$/.test(clean)) return null;
  return Number(clean);
}

// Nombre → texte à mettre dans un champ (« 0,2 »).
export const toFieldText = (value) =>
  value === null || value === undefined ? '' : String(value).replace('.', ',');

// Nom affiché : la marque est ajoutée si le nom ne la contient pas déjà.
export function foodName(food) {
  const brand = food.brand?.trim();
  return brand && !food.name.toLowerCase().includes(brand.toLowerCase())
    ? `${food.name}, ${brand}`
    : food.name;
}

// « Ciqual, 11 g de prot. » : sous le nom d'un résultat de recherche.
export function foodSummary(food) {
  const proteins = food.proteinsG === null ? null : `${formatNombre(food.proteinsG)} g de prot.`;
  return [sourceLabel(food.source), proteins].filter(Boolean).join(', ');
}

// Pour une portion en grammes : calories et protéines (null si la valeur de l'aliment est inconnue).
export function portionValues(food, grams) {
  const factor = Number.isFinite(grams) ? grams / 100 : null;
  const scale = (value) => (factor === null || value === null ? null : value * factor);
  return { kcal: scale(food.energyKcal), proteinsG: scale(food.proteinsG) };
}

// Code-barres saisi : chiffres seulement (les espaces et tirets sont ignorés).
export const cleanBarcode = (text) => String(text ?? '').replace(/[\s.-]/g, '');
export const isBarcode = (text) => /^\d{8,14}$/.test(text);

// « Valeur d'origine Ciqual : 65 kcal, 10,4 g de protéines. »
export function originalSummary(food) {
  const original = food.original;
  if (!original) return '';
  const parts = [];
  if (original.name && original.name !== food.name) parts.push(`« ${original.name} »`);
  if (original.energyKcal !== null && original.energyKcal !== undefined) {
    parts.push(formatKcal(original.energyKcal));
  }
  if (original.proteinsG !== null && original.proteinsG !== undefined) {
    parts.push(`${formatNombre(original.proteinsG)} g de protéines`);
  }
  return `Valeur d’origine ${sourceLabel(food.source)} : ${parts.join(', ')}.`;
}

// Texte du bouton Open Food Facts : grisé avec un compte à rebours quand la limite est atteinte.
export const libelleOff = (off) =>
  off.attente > 0
    ? `Open Food Facts : réessaie dans ${off.attente} s`
    : 'Chercher aussi chez Open Food Facts';
