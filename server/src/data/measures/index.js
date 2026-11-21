// Mesures ménagères d'un aliment : densité (g/ml) pour les volumes, poids moyen pour les pièces.
// Les valeurs viennent de l'USDA FoodData Central (usda-measures.json, extrait par
// `npm run measures:extract`). Les noms USDA sont en anglais : ce fichier les rattache aux aliments
// par mots-clés français sur le NOM (Ciqual, Open Food Facts et aliments perso passent par là).
// Chaque règle est testée dans l'ordre, la première qui correspond gagne : les cas particuliers
// (« lait de coco », « sucre glace », « œufs de poisson »…) viennent donc avant les cas généraux.
import { normalizeSearchText } from '../../utils/text.js';
import usda from './usda-measures.json' with { type: 'json' };

const SOURCE_NAME = 'USDA FoodData Central';

// Mots qui montrent un plat, une conserve ou un produit transformé : pas de poids de pièce.
const PREPARED =
  /(cuit|bouilli|vapeur|saute|poele|grille|roti|frit|four|braise|appertis|surgel|conserve|seche|sechee|deshydrat|confit|farci|puree|rape|jus|soupe|salade|compote|sauce|gratin|tarte|gateau|beignet|chips|poudre|vinaigre|confiture|sirop|boisson|glace|sorbet|nectar|pate|biscuit)/;
const cooked = /\bcuit(e|s|es)?\b/;
const CANNED = /(appertis|conserve|egoutte)/;
const DISH =
  /\b(au|aux|a la|a l'|avec|garni|royal|boulettes?|viande|mouton|poulet|poisson|legumes?|merguez)\b/;

// --- Densités : [expression sur le nom normalisé, clé dans usda-measures.json, aliment proche ?] ---
const D = (test, key, approx = false) => ({ test, key, approx });
const DENSITY_RULES = [
  // Eau
  D((n, c) => /^eaux$/.test(c) || /^eau\b(?! de vie| de coco)/.test(n), 'eau'),
  // Laits végétaux et de coco (avant « lait »)
  D((n) => /^(creme de coco|creme de lait de coco)/.test(n), 'creme_coco'),
  D((n) => /^lait de coco/.test(n), 'lait_coco'),
  D(
    (n) => /^(lait|boisson) (de |au |d'|a l')?soja/.test(n) || /^boisson soja/.test(n),
    'lait_soja',
  ),
  D((n) => /^(lait|boisson) (de |d'|a l')?amande/.test(n), 'lait_amande'),
  // Laits
  D((n) => /^lait concentre sucre/.test(n), 'lait_concentre_sucre'),
  D((n) => /^lait concentre/.test(n), 'lait_concentre'),
  D(
    (n) => /^lait\b.*\bpoudre/.test(n) && /ecreme/.test(n) && !/demi/.test(n),
    'lait_poudre_ecreme',
  ),
  D(
    (n) => /^lait\b.*\bpoudre/.test(n) && !/(1er|2e|2eme|age|infantile|croissance)/.test(n),
    'lait_poudre_entier',
    true,
  ),
  D((n) => /^lait\b/.test(n) && /ecreme/.test(n) && !/demi/.test(n), 'lait_ecreme'),
  D(
    (n) => /^lait\b/.test(n) && /(entier|brebis|chevre|jument|bufflesse|grand melange)/.test(n),
    'lait_entier',
  ),
  D(
    (n) =>
      /^lait\b(?! (de|d')? ?(coco|riz|avoine|noisette|noix|chanvre|epeautre))/.test(n) &&
      !/(poudre|infantile|age)/.test(n),
    'lait_demi_ecreme',
  ),
  // Crèmes (les desserts « crème… » sont exclus)
  D(
    (n) =>
      /^creme (anglaise|brulee|caramel|dessert|patissiere|de (marron|cassis|pruneaux|camembert)|aux oeufs|chantilly|d'isigny)/.test(
        n,
      ),
    null,
  ),
  D((n) => /^creme\b/.test(n) && /epaisse/.test(n) && !/semi/.test(n), 'creme_epaisse'),
  D((n) => /^creme\b/.test(n) && /(fluide|liquide|semi-epaisse|entiere)/.test(n), 'creme_liquide'),
  D((n) => /^creme\b/.test(n) && /legere/.test(n), 'creme_legere'),
  D((n) => /^creme fraiche|^creme$/.test(n), 'creme_epaisse'),
  // Produits laitiers frais et fromages
  D((n) => /^(yaourt|yogourt|yoghourt)/.test(n), 'yaourt'),
  D((n) => /^fromage blanc/.test(n) && !/(fondu|en portion)/.test(n), 'fromage_blanc'),
  D(
    (n) => /^(fromage (frais|a tartiner)|cream cheese|philadelphia|saint moret)/.test(n),
    'fromage_frais_cremeux',
    true,
  ),
  D((n) => /^ricotta/.test(n), 'ricotta'),
  D((n) => /^parmesan|^grana padano|^parmigiano/.test(n), 'parmesan_rape'),
  D((n) => /^mozzarella/.test(n), 'mozzarella_rapee'),
  D(
    (n) =>
      /^(fromage rape|emmental|gruyere|comte|cantal|beaufort|raclette|edam|gouda|cheddar|mimolette)/.test(
        n,
      ),
    'fromage_rape',
    true,
  ),
  // Matières grasses
  D(
    (n) => /^(beurre de cacahuete|beurre d'arachide|pate d'arachide|beurre de cacahuetes)/.test(n),
    'beurre_cacahuete',
  ),
  D(
    (n) =>
      /^beurre\b(?! de (cacao|karite|coco|noix|amande|noisette|sesame|cajou)| d'amande|[ ,]+concentre|[ ,]+clarifie)/.test(
        n,
      ),
    'beurre',
  ),
  D(
    (n) => /^huile\b.*(foie|poisson|hareng|sardine|saumon|morue|beurre|cacao|karite)/.test(n),
    null,
  ),
  D((n) => /^huile\b.*olive/.test(n), 'huile_olive'),
  D((n) => /^huile\b.*colza/.test(n), 'huile_colza'),
  D((n) => /^huile\b.*(coco|coprah|palmiste)/.test(n), 'huile_coco'),
  D((n) => /^huile\b.*sesame/.test(n), 'huile_sesame'),
  D((n) => /^huile\b.*tournesol/.test(n), 'huile_tournesol'),
  D((n) => /^huile\b/.test(n), 'huile_tournesol', true),
  // Jus et autres liquides
  D((n) => /^(jus de citron|citron.*\bjus\b)/.test(n) && !/vert/.test(n), 'jus_citron'),
  D((n) => /^(jus d'orange|orange.*(\bjus\b|pressee))/.test(n), 'jus_orange'),
  D((n) => /^jus de pomme/.test(n), 'jus_pomme'),
  D((n) => /^jus de raisin/.test(n), 'jus_raisin'),
  D((n) => /^(jus|nectar)\b/.test(n), 'jus_pomme', true),
  D((n) => /^vin\b/.test(n), 'vin'),
  D(
    (n) =>
      /^(bouillon|fond de (veau|volaille|boeuf|poisson|legumes)|consomme)/.test(n) &&
      !/(deshydrat|cube|poudre|granule|concentre|paillette|pate)/.test(n),
    'bouillon',
  ),
  D((n) => /^vinaigre\b.*balsamique/.test(n), 'vinaigre_balsamique'),
  D((n) => /^vinaigre\b/.test(n), 'vinaigre'),
  D((n) => /^sauce (de )?soja|^soja,? sauce|^shoyu/.test(n), 'sauce_soja'),
  // Sucrés
  D((n) => /^miel\b/.test(n), 'miel'),
  D((n) => /^sirop d'erable/.test(n), 'sirop_erable'),
  D((n) => /^(sirop de (glucose|mais)|glucose)/.test(n), 'sirop_glucose'),
  D((n) => /^melasse/.test(n), 'melasse'),
  D((n) => /^(confiture|marmelade|gelee de)\b/.test(n), 'confiture'),
  D((n) => /^sucre\b.*glace|^sucre glace/.test(n), 'sucre_glace'),
  D(
    (n) => /^sucre\b.*(roux|cassonade|muscovado|complet)|^(cassonade|muscovado)/.test(n),
    'sucre_roux',
  ),
  D((n) => /^sucre\b/.test(n) && !/(candi|morceau)/.test(n), 'sucre'),
  // Farines et poudres
  D((n) => /^(fecule|amidon|maizena)/.test(n), 'fecule_mais', true),
  D((n) => /^farine\b/.test(n) && /\bmais\b/.test(n), 'farine_mais'),
  D((n) => /^farine\b.*\briz\b/.test(n), 'farine_riz'),
  D((n) => /^farine\b.*sarrasin/.test(n), 'farine_sarrasin'),
  D((n) => /^farine\b.*seigle/.test(n), 'farine_seigle'),
  D(
    (n) => /^farine\b.*(ble|froment)/.test(n) && /(t110|t150|complete|integrale)/.test(n),
    'farine_ble_complete',
  ),
  D((n) => /^farine\b.*(ble|froment)|^farine$/.test(n), 'farine_ble'),
  D((n, c) => /^farine\b/.test(n) || c === 'farines', 'farine_ble', true),
  D((n, c) => /^sel\b|^fleur de sel/.test(n) || c === 'sels', 'sel'),
  D(
    (n) =>
      /(^cacao\b|^poudre de cacao).*(poudre|maigre|non sucre)|^poudre de cacao|^cacao,? en poudre/.test(
        n,
      ),
    'cacao_poudre',
  ),
  D((n) => /^(levure chimique|poudre a lever)/.test(n), 'levure_chimique'),
  D((n) => /^levure\b.*(seche|deshydrat)/.test(n), 'levure_boulangere'),
  D((n) => /^poivre\b/.test(n), 'poivre'),
  D((n) => /^cannelle\b/.test(n), 'cannelle'),
  D((n) => /^curry\b/.test(n), 'curry'),
  D((n) => /^gingembre\b.*(poudre|moulu|sec)/.test(n), 'gingembre_poudre'),
  // Céréales, légumineuses, graines (crues ou sèches : la version cuite a une autre densité)
  D(
    (n) =>
      /^riz\b/.test(n) &&
      cooked.test(n) &&
      !/(souffle|lait|sauvage|cantonais|pilaf|galette|gateau)/.test(n),
    'riz_cuit',
  ),
  D((n) => /^riz\b/.test(n) && !cooked.test(n) && /(complet|brun)/.test(n), 'riz_complet'),
  D(
    (n) =>
      /^riz\b/.test(n) &&
      !cooked.test(n) &&
      !/(souffle|lait|sauvage|cantonais|pilaf|farine|galette|gateau|vinaigre|cracker|biscuit|nouille|vermicelle|papier|creme|boisson|dessert|salade|risotto|cuisine)/.test(
        n,
      ),
    'riz_blanc',
  ),
  D((n) => /^semoule\b/.test(n) && !cooked.test(n) && !/(lait|dessert|gateau)/.test(n), 'semoule'),
  D((n) => /^couscous\b/.test(n) && !cooked.test(n) && !DISH.test(n), 'couscous'),
  D(
    (n) => /^lentille/.test(n) && !cooked.test(n) && !CANNED.test(n) && !/(salade|cuisine)/.test(n),
    'lentilles',
  ),
  D(
    (n) =>
      /^pois chiche/.test(n) &&
      !cooked.test(n) &&
      !CANNED.test(n) &&
      !/(salade|houmous|hummus|farine|cuisine)/.test(n),
    'pois_chiches',
  ),
  D(
    (n) =>
      /^haricots? (blanc|rouge|noir|sec|tarbais|lingot|coco)/.test(n) &&
      !cooked.test(n) &&
      !CANNED.test(n) &&
      !/cuisine/.test(n),
    'haricots_secs',
    true,
  ),
  D((n) => /^quinoa/.test(n) && !cooked.test(n), 'quinoa'),
  D(
    (n) =>
      /(flocons? d'avoine|^avoine\b)/.test(n) && !/(boisson|biscuit|barre|bouilli|cuit)/.test(n),
    'flocons_avoine',
  ),
  D((n) => /^amande\b.*poudre|^poudre d'amande/.test(n), 'amandes_poudre'),
  D((n) => /^amande\b.*(effilee|emincee)/.test(n), 'amandes_effilees'),
  D(
    (n) =>
      /^amande\b(?!.*(lait|huile|puree|pate|biscuit|dragee|sucree|grillee|caramel|chocolat))/.test(
        n,
      ),
    'amandes_entieres',
  ),
  D((n) => /^(sesame|graines? de sesame)/.test(n) && !/(huile|puree|tahin|pate)/.test(n), 'sesame'),
  D((n) => /^(graines? de lin|lin,? graine)/.test(n), 'lin'),
  D((n) => /^raisins? (sec|de corinthe|de smyrne)/.test(n), 'raisins_secs'),
  D((n) => /^pepites? de chocolat/.test(n), 'pepites_chocolat'),
  D((n) => /^noix de coco\b.*(rap|sec)|^coco (rapee|seche)/.test(n), 'noix_coco_rapee', true),
  // Sauces
  D(
    (n) => /(concentre de tomate|double concentre|tomates?.*concentre)/.test(n),
    'concentre_tomate',
  ),
  D(
    (n) =>
      /^(coulis de tomate|sauce tomate|passata|puree de tomate|tomates? (concassee|pelee|en conserve|appertis))/.test(
        n,
      ),
    'sauce_tomate',
  ),
  D((n) => /^(ketchup|catsup)/.test(n), 'ketchup'),
  D((n) => /^mayonnaise/.test(n), 'mayonnaise'),
  D((n) => /^moutarde\b/.test(n), 'moutarde'),
];

// --- Poids par pièce ---
const P = (test, key, extra) => ({ test, key, ...extra });
const notPrepared = (n) => !PREPARED.test(n) && !/\bsecs?\b|moelleux/.test(n);
const EGG_EXCLUDED =
  /(\b(au|aux)\b|d'(oie|autruche)|de (caille|oie|cane|dinde|poisson|lump|saumon|truite|morue|cabillaud|esturgeon|hareng|mulet)|poudre|brouille|omelette|au plat|mimosa|mayonnaise|farci|en neige|a la neige|liquide|pasteurise)/;
const PIECE_RULES = [
  P(
    (n) =>
      /^oeufs?, blanc|^blanc d'oeuf|^blancs? d'oeuf/.test(n) &&
      /cru|^blanc/.test(n) &&
      !/poudre|cuit/.test(n),
    'blanc_oeuf',
  ),
  P((n) => /^oeufs?, jaune|^jaunes? d'oeuf/.test(n) && !/poudre|cuit/.test(n), 'jaune_oeuf'),
  P((n) => /^oeufs?\b/.test(n) && !EGG_EXCLUDED.test(n) && !/blanc|jaune/.test(n), 'oeuf'),
  P(
    (n) =>
      /^ail\b(?! des ours)/.test(n) &&
      !/(poudre|seche|granule|flocon|pate|puree|confit|semoule|sel|beurre|sauce|cuisine)/.test(n),
    'gousse_ail',
  ),
  P(
    (n) =>
      /^oignon\b/.test(n) &&
      notPrepared(n) &&
      !/(nouveau|cebette|ciboule|rondelle|cocktail|blanc au vinaigre)/.test(n),
    'oignon',
  ),
  P((n) => /^tomates? (cerise|cocktail)/.test(n) && notPrepared(n), 'tomate_cerise'),
  P(
    (n) =>
      /^tomate\b/.test(n) &&
      notPrepared(n) &&
      !/(concentre|coulis|pelee|cerise|cocktail|concassee|olivette|verte)/.test(n),
    'tomate',
  ),
  P((n) => /^carotte\b/.test(n) && notPrepared(n), 'carotte'),
  P(
    (n) =>
      /^pommes? de terre\b/.test(n) &&
      notPrepared(n) &&
      !/(duchesse|dauphine|noisette|rissolee|croquette|rosti|fondante|sans peau)/.test(n),
    'pomme_de_terre',
  ),
  P((n) => /^patate douce\b/.test(n) && notPrepared(n), 'patate_douce'),
  P(
    (n) =>
      /^pommes?\b(?! de terre| de pin| d'amour| cannelle| d'api)/.test(n) &&
      notPrepared(n) &&
      !/(duchesse|dauphine|noisette|chausson|tatin)/.test(n),
    'pomme',
  ),
  P((n) => /^poires?\b/.test(n) && notPrepared(n) && !/belle helene/.test(n), 'poire'),
  P((n) => /^bananes?\b/.test(n) && notPrepared(n) && !/(plantain|flambee)/.test(n), 'banane'),
  P(
    (n) => /^(citron.*\bjus\b|jus de citron)/.test(n) && !/(vert|concentre|boisson)/.test(n),
    'jus_citron',
  ),
  P(
    (n) =>
      /^citron\b/.test(n) &&
      notPrepared(n) &&
      !/(vert|zeste|ecorce|meringue|limonade|marmelade|presse)/.test(n),
    'citron',
  ),
  P((n) => /^(citron vert|lime)\b/.test(n) && notPrepared(n), 'citron_vert'),
  P(
    (n) =>
      /^(orange.*(\bjus\b|pressee)|jus d'orange)/.test(n) && !/(concentre|boisson|nectar)/.test(n),
    'jus_orange',
  ),
  P(
    (n) =>
      /^orange\b/.test(n) && notPrepared(n) && !/(zeste|ecorce|marmelade|confite|presse)/.test(n),
    'orange',
  ),
  P((n) => /^(clementine|mandarine|satsuma)/.test(n) && notPrepared(n), 'clementine'),
  P((n) => /^courgette\b/.test(n) && notPrepared(n), 'courgette'),
  P((n) => /^poivron\b/.test(n) && notPrepared(n), 'poivron'),
  P((n) => /^avocat\b/.test(n) && notPrepared(n), 'avocat'),
  P((n) => /^concombre\b/.test(n) && notPrepared(n), 'concombre'),
  P((n) => /^aubergine\b/.test(n) && notPrepared(n) && !/caviar/.test(n), 'aubergine'),
  P(
    (n) => /^champignons?( de paris| de couche|, tout type|, cru|$)/.test(n) && notPrepared(n),
    'champignon',
  ),
  P((n) => /^celeri branche/.test(n) && notPrepared(n), 'celeri_branche'),
  P((n) => /^fenouil\b/.test(n) && notPrepared(n) && !/(graine|sauvage)/.test(n), 'fenouil'),
  P((n) => /^poireau\b/.test(n) && notPrepared(n), 'poireau'),
  P((n) => /^betterave\b/.test(n) && notPrepared(n), 'betterave'),
  P((n) => /^kiwi\b/.test(n) && notPrepared(n), 'kiwi'),
  P((n) => /^mangue\b/.test(n) && notPrepared(n), 'mangue'),
  P((n) => /^abricot\b/.test(n) && notPrepared(n), 'abricot'),
  P((n) => /^prune\b/.test(n) && notPrepared(n) && !/cythere/.test(n), 'prune'),
  P((n) => /^figue\b/.test(n) && notPrepared(n) && !/barbarie/.test(n), 'figue'),
];

const find = (rules, name, category) => rules.find((rule) => rule.test(name, category));

// Clés des valeurs retenues pour un nom (sert aux tests et à la relecture de la table).
export function matchedKeys(food) {
  const name = normalizeSearchText(food?.name ?? '');
  const category = normalizeSearchText(food?.category ?? '');
  return {
    density: find(DENSITY_RULES, name, category)?.key ?? null,
    piece: find(PIECE_RULES, name, category)?.key ?? null,
  };
}

/**
 * Mesures ménagères d'un aliment (Ciqual, Open Food Facts ou perso : seul le nom compte).
 * @param {{ name: string, category?: string | null }} food
 * @returns {{ gramsPerMl: number, gramsPerMlSource: 'reference' | 'water', pieceGrams: number | null,
 *             pieceLabel?: string, source: string | null }}
 *   - gramsPerMl : densité en g/ml, 1 (eau) si on n'a pas de valeur de référence ;
 *   - pieceGrams : poids moyen d'une pièce, null si inconnu ;
 *   - source : d'où viennent les valeurs de référence, null si aucune.
 */
export function measuresFor(food) {
  const name = normalizeSearchText(food?.name ?? '');
  const category = normalizeSearchText(food?.category ?? '');

  const densityRule = find(DENSITY_RULES, name, category);
  const density = densityRule?.key ? usda.densities[densityRule.key] : null;
  const pieceRule = find(PIECE_RULES, name, category);
  const piece = pieceRule ? usda.pieces[pieceRule.key] : null;

  const parts = [];
  if (density)
    parts.push(`densité : fdc ${density.fdcId}${densityRule.approx ? ', aliment proche' : ''}`);
  if (piece) parts.push(`pièce : fdc ${piece.fdcId}`);

  const result = {
    gramsPerMl: density ? density.gramsPerMl : 1,
    gramsPerMlSource: density ? 'reference' : 'water',
    pieceGrams: piece ? piece.pieceGrams : null,
  };
  if (piece) result.pieceLabel = piece.label;
  result.source = parts.length > 0 ? `${SOURCE_NAME} (${parts.join(' ; ')})` : null;
  return result;
}
