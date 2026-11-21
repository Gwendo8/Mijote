// Refait `src/data/measures/usda-measures.json` à partir du téléchargement officiel de l'USDA.
//
//   1. Télécharger (domaine public, CC0) :
//      https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_sr_legacy_food_csv_2018-04.zip
//      puis le dézipper dans un dossier à part, HORS du dépôt.
//   2. npm run measures:extract -- /chemin/vers/FoodData_Central_sr_legacy_food_csv_2018-04
//
// Les aliments et mesures retenus sont listés dans src/data/measures/usda-selection.js.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { DENSITIES, PIECES } from '../src/data/measures/usda-selection.js';

// Volume en ml d'une mesure américaine (le début du texte du « modifier » donne l'unité).
const ML = {
  cup: 236.588,
  tbsp: 14.7868,
  tablespoon: 14.7868,
  tsp: 4.92892,
  teaspoon: 4.92892,
  'fl oz': 29.5735,
  ml: 1,
};
const unitOf = (modifier) =>
  Object.keys(ML)
    .sort((a, b) => b.length - a.length)
    .find(
      (unit) =>
        modifier === unit || modifier.startsWith(`${unit} `) || modifier.startsWith(`${unit},`),
    );

// Lecteur CSV minimal (champs entre guillemets, "" pour un guillemet).
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') ((field += '"'), i++);
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') (row.push(field), (field = ''));
    else if (c === '\n') (row.push(field), rows.push(row), (row = []), (field = ''));
    else if (c !== '\r') field += c;
  }
  const [header, ...lines] = rows;
  return lines.map((line) => Object.fromEntries(header.map((name, i) => [name, line[i]])));
}

const dir = process.argv[2];
if (!dir) throw new Error('Usage : npm run measures:extract -- <dossier du téléchargement USDA>');
const read = (name) => parseCsv(readFileSync(join(dir, name), 'utf8'));
const foods = new Map(read('food.csv').map((f) => [f.fdc_id, f.description]));
const portions = read('food_portion.csv');

function portion(fdcId, modifier) {
  const found = portions.find((p) => p.fdc_id === String(fdcId) && p.modifier === modifier);
  if (!found) throw new Error(`Mesure introuvable : fdc ${fdcId} « ${modifier} »`);
  return {
    found,
    amount: Number(found.amount),
    grams: Number(found.gram_weight),
    name: foods.get(String(fdcId)),
  };
}

const round = (n, d) => Math.round(n * 10 ** d) / 10 ** d;
const out = {
  source: 'USDA FoodData Central, SR Legacy (avril 2018), tableau food_portion',
  densities: {},
  pieces: {},
};

for (const [key, [fdcId, modifier]] of Object.entries(DENSITIES)) {
  const { amount, grams, name } = portion(fdcId, modifier);
  const unit = unitOf(modifier);
  if (!unit) throw new Error(`Unité de volume inconnue : « ${modifier} »`);
  out.densities[key] = {
    gramsPerMl: round(grams / (amount * ML[unit]), 3),
    fdcId,
    usda: name,
    measure: `${amount} ${modifier} = ${grams} g`,
  };
}
for (const [key, [fdcId, modifier, label]] of Object.entries(PIECES)) {
  const { amount, grams, name } = portion(fdcId, modifier);
  out.pieces[key] = {
    pieceGrams: round(grams / amount, 1),
    label,
    fdcId,
    usda: name,
    measure: `${amount} ${modifier} = ${grams} g`,
  };
}

const target = new URL('../src/data/measures/usda-measures.json', import.meta.url);
writeFileSync(target, `${JSON.stringify(out, null, 2)}\n`);
console.log(
  `${Object.keys(out.densities).length} densités et ${Object.keys(out.pieces).length} poids de pièces écrits.`,
);
