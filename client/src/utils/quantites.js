// Lit la quantité écrite dans une ligne d'ingrédient (« 20 cl de lait », « 2 œufs », « 3 c. à soupe d'huile »)
// et la convertit en grammes quand l'aliment est connu. Fonctions pures, sans React.
// Les volumes de la cuillère et de la tasse sont les mêmes que ceux du serveur (server/src/data/measures/).

const ML_CUILLERE_SOUPE = 14.787;
const ML_CUILLERE_CAFE = 4.929;
const ML_TASSE = 236.588;

const NOMBRE = String.raw`\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:[.,]\d+)?`;
const DEBUT = String.raw`(?<![\p{L}\d.,/])`;

// Unités reconnues, de la plus précise à la plus courte. Texte déjà sans accents ni majuscules.
// `facteur` : grammes (masse) ou millilitres (volume) pour une unité.
const UNITES = [
  {
    re: String.raw`(?:c(?:uilleres?)?\.?\s*a\.?\s*(?:soupe|s)|cs|cas)`,
    type: 'volume',
    facteur: ML_CUILLERE_SOUPE,
    libelle: 'c. à soupe',
  },
  {
    re: String.raw`(?:c(?:uilleres?)?\.?\s*a\.?\s*(?:cafe|c)|cc|cac)`,
    type: 'volume',
    facteur: ML_CUILLERE_CAFE,
    libelle: 'c. à café',
  },
  { libelle: 'tasse', re: String.raw`tasses?`, type: 'volume', facteur: ML_TASSE },
  { libelle: 'kg', re: String.raw`(?:kilogrammes?|kilos?|kg)`, type: 'masse', facteur: 1000 },
  { libelle: 'mg', re: String.raw`(?:milligrammes?|mg)`, type: 'masse', facteur: 0.001 },
  { libelle: 'g', re: String.raw`(?:grammes?|gr|g)`, type: 'masse', facteur: 1 },
  { libelle: 'ml', re: String.raw`(?:millilitres?|ml)`, type: 'volume', facteur: 1 },
  { libelle: 'cl', re: String.raw`(?:centilitres?|cl)`, type: 'volume', facteur: 10 },
  { libelle: 'dl', re: String.raw`(?:decilitres?|dl)`, type: 'volume', facteur: 100 },
  { libelle: 'l', re: String.raw`(?:litres?|l)`, type: 'volume', facteur: 1000 },
];
const UNITES_RE = UNITES.map((u) => ({ ...u, re: new RegExp(`^(?:${u.re})(?![\\p{L}\\d])`, 'u') }));

// Mots qui ne sont ni une masse, ni un volume, ni une pièce : on ne sait pas les convertir.
const INCALCULABLES = new RegExp(
  `^(?:pincees?|filets?|boites?|sachets?|verres?|bottes?|bouquets?|noix|noisettes?|poignees?|brins?|branches?|` +
    `zestes?|traits?|gouttes?|tranches?|parts?|portions?|paquets?|pots?|briques?|bouteilles?|canettes?|bols?|` +
    `louches?|rouleaux?|barquettes?|bocaux|bocal|morceaux?|doses?|cubes?|tetes?|feuilles?|quartiers?|carres?|` +
    `tablettes?|conserves?|peu|quelques?)(?![\\p{L}])`,
  'u',
);
// Contenants : « 2 boîtes de 400 g » = 2 × 400 g.
const CONTENANTS =
  /^(?:boites?|sachets?|pots?|briques?|paquets?|bouteilles?|canettes?|barquettes?|bocaux|bocal|conserves?)\b/u;

function normaliser(texte) {
  return String(texte ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/(\d)\s*½/g, '$1 1/2')
    .replace(/(\d)\s*¼/g, '$1 1/4')
    .replace(/(\d)\s*¾/g, '$1 3/4')
    .replace(/½/g, '1/2')
    .replace(/¼/g, '1/4')
    .replace(/¾/g, '3/4')
    .replace(/[’‘]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

// « 1,5 » → 1.5 ; « 1/2 » → 0.5 ; « 1 1/2 » → 1.5
function lireNombre(texte) {
  const mixte = texte.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixte) return Number(mixte[1]) + Number(mixte[2]) / Number(mixte[3]);
  const fraction = texte.match(/^(\d+)\/(\d+)$/);
  if (fraction) return Number(fraction[1]) / Number(fraction[2]);
  return Number(texte.replace(',', '.'));
}

// Au début de `reste` : une unité de masse ou de volume → { type, valeur (g ou ml), longueur, texte }.
function lireUnite(reste, nombre) {
  for (const unite of UNITES_RE) {
    const trouve = unite.re.exec(reste);
    if (trouve) {
      return {
        type: unite.type,
        valeur: nombre * unite.facteur,
        longueur: trouve[0].length,
        texte: `${texteNombre(nombre)} ${unite.libelle}`,
      };
    }
  }
  return null;
}

// Cherche « 400 g », « 2 x 140 g », « 20 cl » n'importe où dans le texte.
function mesureExplicite(texte) {
  const re = new RegExp(`${DEBUT}(?:(\\d+)\\s*[x×]\\s*)?(${NOMBRE})\\s*`, 'gu');
  let trouve;
  while ((trouve = re.exec(texte))) {
    const unite = lireUnite(texte.slice(re.lastIndex), lireNombre(trouve[2]));
    if (unite) {
      const fois = trouve[1] ? Number(trouve[1]) : 1;
      return {
        ...unite,
        valeur: unite.valeur * fois,
        texte: fois === 1 ? unite.texte : `${fois} × ${unite.texte}`,
      };
    }
  }
  return null;
}

function quantiteMesure(mesure, texte) {
  return mesure.type === 'masse'
    ? { type: 'masse', grammes: mesure.valeur, texte }
    : { type: 'volume', ml: mesure.valeur, texte };
}

// Texte d'une ligne → { type: 'masse', grammes, texte } | { type: 'volume', ml, texte } | { type: 'pieces', nombre, texte },
// ou null quand la quantité est absente ou impossible à convertir (pincée, boîte sans poids, « un peu »…).
export function lireQuantite(ligne) {
  const texte = normaliser(ligne);
  if (!texte) return null;

  const debut = new RegExp(`^(${NOMBRE})\\s*(?:[x×]\\s*)?`, 'u').exec(texte);
  const mot = new RegExp('^(?:un|une)\\s+(?=\\p{L})', 'u').exec(texte);
  if (!debut && !mot) {
    // « farine 200 g » : une mesure écrite plus loin
    const loin = mesureExplicite(texte);
    return loin ? quantiteMesure(loin, loin.texte) : null;
  }

  const nombre = debut ? lireNombre(debut[1]) : 1;
  const apres = texte.slice(debut ? debut[0].length : mot[0].length);
  if (!(nombre > 0)) return null;

  // « 2 x 100 g » : le « x » est déjà passé, le nombre qui suit est le poids de chacun
  if (debut && /[x×]/u.test(debut[0])) {
    const second = new RegExp(`^(${NOMBRE})\\s*`, 'u').exec(apres);
    const unite = second && lireUnite(apres.slice(second[0].length), lireNombre(second[1]));
    if (unite)
      return quantiteMesure(
        { ...unite, valeur: unite.valeur * nombre },
        `${texteNombre(nombre)} × ${unite.texte}`,
      );
    return null;
  }

  const unite = debut ? lireUnite(apres, nombre) : null;
  if (unite) {
    return quantiteMesure(unite, unite.texte);
  }
  if (mot && lireUnite(apres, 1)) {
    const u = lireUnite(apres, 1);
    return quantiteMesure(u, u.texte);
  }

  // Un mot qui n'est pas une unité de mesure
  if (INCALCULABLES.test(apres)) {
    if (CONTENANTS.test(apres)) {
      const enDe = /^\p{L}+\s+(?:de|d')\s*(.*)$/u.exec(apres);
      const poids = enDe && new RegExp(`^(${NOMBRE})\\s*`, 'u').exec(enDe[1]);
      const u = poids && lireUnite(enDe[1].slice(poids[0].length), lireNombre(poids[1]));
      if (u)
        return quantiteMesure(
          { ...u, valeur: u.valeur * nombre },
          `${texteNombre(nombre)} × ${u.texte}`,
        );
    }
    const explicite = mesureExplicite(apres);
    return explicite ? quantiteMesure(explicite, explicite.texte) : null;
  }
  if (/^\p{L}/u.test(apres)) {
    // « 2 oignons (200 g) » : un poids écrit sur la ligne est plus sûr qu'un poids moyen par pièce
    const ecrit = mesureExplicite(apres);
    if (ecrit) return quantiteMesure(ecrit, ecrit.texte);
    return {
      type: 'pieces',
      nombre,
      texte: texteNombre(nombre),
    };
  }
  return null;
}

const arrondi = (n) => (n >= 10 ? Math.round(n) : Math.round(n * 10) / 10);
const texteNombre = (n) => String(n).replace('.', ',');

// Quantité + mesures de l'aliment choisi → { grammes, explication, estime } ou null si on ne peut pas calculer.
// `estime` : la densité n'est pas connue, on a pris celle de l'eau.
export function calculerGrammes(quantite, measures) {
  if (!quantite) return null;
  if (quantite.type === 'masse') {
    const grammes = arrondi(quantite.grammes);
    return { grammes, explication: `${quantite.texte} → ${texteNombre(grammes)} g`, estime: false };
  }
  if (!measures) return null;
  if (quantite.type === 'volume') {
    if (typeof measures.gramsPerMl !== 'number') return null;
    const grammes = arrondi(quantite.ml * measures.gramsPerMl);
    return {
      grammes,
      explication: `${quantite.texte} → ${texteNombre(grammes)} g`,
      estime: measures.gramsPerMlSource === 'water',
    };
  }
  if (typeof measures.pieceGrams !== 'number') return null;
  const grammes = arrondi(quantite.nombre * measures.pieceGrams);
  const piece = measures.pieceLabel ?? `1 pièce de ${texteNombre(measures.pieceGrams)} g`;
  return {
    grammes,
    explication: `${texteNombre(quantite.nombre)} × ${piece} = ${texteNombre(grammes)} g`,
    estime: false,
  };
}
