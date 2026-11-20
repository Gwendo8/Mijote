import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { XMLParser } from 'fast-xml-parser';
import * as foodsRepository from '../repositories/foods.repository.js';
import { inTransaction } from '../repositories/transactions.js';
import { normalizeSearchText } from '../utils/text.js';

// Import de la table Ciqual (ANSES) dans `foods`. Voir `npm run ciqual:import`.
//
// L'ANSES publie la table en plusieurs fichiers XML (les noms portent la date de la version) :
//   alim_AAAA_MM_JJ.xml      les aliments (code, nom français, groupe)
//   alim_grp_AAAA_MM_JJ.xml  les noms des groupes et sous-groupes
//   compo_AAAA_MM_JJ.xml     les teneurs de chaque aliment (très gros : environ 70 Mo)
// (const_*.xml et sources_*.xml ne servent pas : les codes des nutriments utiles sont fixés ci-dessous.)

// Codes des constituants de const_*.xml. Quand il y en a deux, le premier est préféré, le second sert de secours.
const CONST = {
  energyKcal: [328, 333], // règlement UE 1169/2011, sinon facteur de Jones (kcal/100 g)
  proteinsG: [25003, 25000], // N x 6,25 (règle d'étiquetage), sinon facteur de Jones (g/100 g)
  carbsG: [31000],
  fatsG: [40000],
};
const WANTED = new Set(Object.values(CONST).flat());

const parser = new XMLParser({ ignoreAttributes: true, parseTagValue: false, trimValues: true });

// Les blocs <TAG>…</TAG> d'un fichier, chacun lu séparément : le gros fichier compo n'est jamais chargé d'un bloc.
function* blocks(xml, tag) {
  for (const match of xml.matchAll(new RegExp(`<${tag}>[\\s\\S]*?</${tag}>`, 'g'))) {
    yield parser.parse(match[0])[tag];
  }
}

// Règle des valeurs écrites en texte par l'ANSES :
//  - « 12,5 » → 12.5 (virgule décimale) ;
//  - « traces » → 0 ;
//  - « < 0,5 » (moins que le seuil de mesure) → 0.5, le seuil lui-même ;
//  - « - », vide ou illisible → null (inconnu).
export function parseAmount(text) {
  const value = String(text ?? '')
    .trim()
    .replace(',', '.');
  if (value === '' || value === '-') return null;
  if (value.toLowerCase() === 'traces') return 0;
  const match = value.match(/^<?\s*(\d+(?:\.\d+)?)$/);
  return match ? Math.round(Number(match[1]) * 100) / 100 : null;
}

const cleanText = (text) => {
  const value = String(text ?? '').trim();
  return value === '' || value === '-' ? null : value;
};

// Catégorie d'un aliment : son sous-groupe (ex. « viandes cuites »), sinon son groupe
function categoryNames(groupsXml) {
  const names = new Map();
  for (const row of blocks(groupsXml, 'ALIM_GRP')) {
    const group = cleanText(row.alim_grp_nom_fr);
    const sub = cleanText(row.alim_ssgrp_nom_fr);
    names.set(`${row.alim_grp_code}`, group);
    if (sub) names.set(`${row.alim_grp_code}|${row.alim_ssgrp_code}`, sub);
  }
  return names;
}

// Teneurs utiles de chaque aliment : { [code aliment]: { [code constituant]: nombre | null } }
function amounts(compoXml) {
  const result = new Map();
  for (const row of blocks(compoXml, 'COMPO')) {
    const constCode = Number(row.const_code);
    if (!WANTED.has(constCode)) continue;
    const code = String(row.alim_code);
    if (!result.has(code)) result.set(code, {});
    result.get(code)[constCode] = parseAmount(row.teneur);
  }
  return result;
}

const firstKnown = (values, codes) => {
  for (const code of codes)
    if (values[code] !== null && values[code] !== undefined) return values[code];
  return null;
};

// Les trois fichiers (texte XML) → la liste des aliments au format de la table foods
export function parseCiqual({ alim, groups, compo }) {
  const categories = categoryNames(groups);
  const teneurs = amounts(compo);
  const foods = [];
  for (const row of blocks(alim, 'ALIM')) {
    const code = String(row.alim_code ?? '').trim();
    const name = cleanText(row.alim_nom_fr)?.slice(0, 255);
    if (!code || !name) continue;
    const values = teneurs.get(code) ?? {};
    const category =
      categories.get(`${row.alim_grp_code}|${row.alim_ssgrp_code}`) ??
      categories.get(`${row.alim_grp_code}`) ??
      null;
    foods.push({
      ciqualCode: code,
      name,
      searchName: normalizeSearchText(name),
      category: category?.slice(0, 255) ?? null,
      energyKcal: firstKnown(values, CONST.energyKcal),
      proteinsG: firstKnown(values, CONST.proteinsG),
      carbsG: firstKnown(values, CONST.carbsG),
      fatsG: firstKnown(values, CONST.fatsG),
    });
  }
  return foods;
}

// Cherche les trois fichiers dans un dossier (par leur début de nom, majuscules ou non)
export async function readCiqualFolder(folder) {
  const files = await readdir(folder);
  const find = (test) => files.find((file) => /\.xml$/i.test(file) && test(file.toLowerCase()));
  const names = {
    alim: find((f) => f.startsWith('alim_') && !f.startsWith('alim_grp')),
    groups: find((f) => f.startsWith('alim_grp')),
    compo: find((f) => f.startsWith('compo')),
  };
  const missing = Object.entries(names)
    .filter(([, name]) => !name)
    .map(([key]) => key);
  if (missing.length > 0) {
    const label = { alim: 'alim_….xml', groups: 'alim_grp_….xml', compo: 'compo_….xml' };
    throw new Error(
      `Fichier manquant dans « ${folder} » : ${missing.map((key) => label[key]).join(', ')}`,
    );
  }
  const read = async (name) => (await readFile(join(folder, name), 'utf8')).replace(/^\uFEFF/, '');
  return {
    alim: await read(names.alim),
    groups: await read(names.groups),
    compo: await read(names.compo),
  };
}

const FIELDS = ['name', 'searchName', 'category', 'energyKcal', 'proteinsG', 'carbsG', 'fatsG'];
// Les décimales arrivent de la base en texte (« 274.00 ») : on compare des nombres
const same = (before, after) => {
  if (before === null || before === undefined || after === null)
    return before == null && after === null;
  return typeof after === 'number' ? Number(before) === after : before === after;
};

// Met la table `foods` à jour d'après la liste lue :
//  - aliment nouveau → ajouté ; connu (clé : code Ciqual) → mis à jour s'il a changé, et réactivé s'il était archivé ;
//  - aliment qui n'est plus dans le fichier → archivé (jamais supprimé : des recettes peuvent l'utiliser) ;
//  - les corrections de l'admin ne sont jamais touchées (autre table).
// Tout se fait d'un bloc : en cas d'erreur, rien n'est modifié. Peut être relancé sans danger.
export async function importCiqual(foods) {
  if (foods.length === 0) {
    throw new Error(
      "Aucun aliment trouvé dans les fichiers : vérifie que c'est bien la table Ciqual",
    );
  }

  return inTransaction(async (transaction) => {
    const known = new Map(
      (await foodsRepository.findAllCiqual()).map((food) => [food.ciqualCode, food]),
    );
    const seen = new Set();
    const report = { added: 0, updated: 0, restored: 0, unchanged: 0, archived: 0 };
    const toCreate = [];

    for (const food of foods) {
      if (seen.has(food.ciqualCode)) continue; // code en double dans le fichier : le premier gagne
      seen.add(food.ciqualCode);
      const existing = known.get(food.ciqualCode);
      if (!existing) {
        toCreate.push({ ...food, source: 'ciqual' });
        continue;
      }
      const changes = {};
      for (const field of FIELDS)
        if (!same(existing[field], food[field])) changes[field] = food[field];
      const restore = existing.archivedAt !== null;
      if (restore) changes.archivedAt = null;
      if (Object.keys(changes).length === 0) {
        report.unchanged += 1;
        continue;
      }
      await foodsRepository.updateById(existing.id, changes, { transaction });
      if (restore) report.restored += 1;
      else report.updated += 1;
    }

    for (let i = 0; i < toCreate.length; i += 500) {
      await foodsRepository.createMany(toCreate.slice(i, i + 500), { transaction });
    }
    report.added = toCreate.length;

    const gone = [...known.values()].filter(
      (f) => !seen.has(f.ciqualCode) && f.archivedAt === null,
    );
    if (gone.length > 0) {
      await foodsRepository.archiveMany(
        gone.map((f) => f.id),
        { transaction },
      );
    }
    report.archived = gone.length;
    return report;
  });
}

export async function importCiqualFolder(folder) {
  return importCiqual(parseCiqual(await readCiqualFolder(folder)));
}
