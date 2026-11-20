// Nom « de recherche » : minuscules, sans accents (« Crème brûlée » → « creme brulee »).
// Rangé dans foods.search_name pour les aliments ajoutés par le serveur.
export function normalizeSearchText(text) {
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .replace(/\s+/g, ' ')
    .trim();
}
