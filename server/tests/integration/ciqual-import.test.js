import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Food, FoodCorrection } from '../../src/models/index.js';
import {
  importCiqual,
  importCiqualFolder,
  parseCiqual,
  readCiqualFolder,
} from '../../src/services/ciqual-import.service.js';
import { alimXml, compoXml, groupsXml } from '../fixtures/ciqual.js';
import { createFood, resetAll } from '../helpers.js';

let folder;
beforeEach(async () => {
  await resetAll();
  folder = await mkdtemp(join(tmpdir(), 'mijote-ciqual-'));
  await writeFile(join(folder, 'alim_2025_11_03.xml'), alimXml);
  await writeFile(join(folder, 'alim_grp_2025_11_03.xml'), groupsXml);
  await writeFile(join(folder, 'compo_2025_11_03.xml'), compoXml);
});
afterEach(() => rm(folder, { recursive: true, force: true }));

describe('import Ciqual', () => {
  it('ajoute les aliments avec leur nom de recherche', async () => {
    const report = await importCiqualFolder(folder);
    expect(report).toEqual({ added: 3, updated: 0, restored: 0, unchanged: 0, archived: 0 });

    const poulet = await Food.findOne({ where: { ciqualCode: '20047' } });
    expect(poulet).toMatchObject({
      source: 'ciqual',
      ownerId: null,
      name: 'Poulet, blanc, cuit',
      searchName: 'poulet, blanc, cuit',
      category: 'viandes cuites',
      archivedAt: null,
    });
    expect(Number(poulet.energyKcal)).toBe(151);
    expect((await Food.findOne({ where: { ciqualCode: '11000' } })).energyKcal).toBeNull();
  });

  it('peut être relancé sans rien changer', async () => {
    await importCiqualFolder(folder);
    const report = await importCiqualFolder(folder);
    expect(report).toEqual({ added: 0, updated: 0, restored: 0, unchanged: 3, archived: 0 });
    expect(await Food.count()).toBe(3);
  });

  it('met à jour un aliment modifié, sans toucher à sa correction', async () => {
    await importCiqualFolder(folder);
    const poulet = await Food.findOne({ where: { ciqualCode: '20047' } });
    await FoodCorrection.create({ foodId: poulet.id, energyKcal: 140, note: 'Vérifié' });
    await poulet.update({ name: 'Ancien nom', energyKcal: 100 });

    const report = await importCiqualFolder(folder);
    expect(report.updated).toBe(1);
    const after = await Food.findByPk(poulet.id);
    expect(after.name).toBe('Poulet, blanc, cuit');
    expect(Number(after.energyKcal)).toBe(151);
    expect(Number((await FoodCorrection.findOne()).energyKcal)).toBe(140);
  });

  it('archive sans jamais supprimer un aliment absent du fichier, et le réactive s’il revient', async () => {
    await importCiqualFolder(folder);
    const foods = parseCiqual({ alim: alimXml, groups: groupsXml, compo: compoXml });

    const report = await importCiqual(foods.slice(0, 2));
    expect(report.archived).toBe(1);
    expect(await Food.count()).toBe(3);
    const gone = await Food.findOne({ where: { ciqualCode: '11000' } });
    expect(gone.archivedAt).not.toBeNull();

    // déjà archivé : pas recompté
    expect((await importCiqual(foods.slice(0, 2))).archived).toBe(0);

    const back = await importCiqual(foods);
    expect(back.restored).toBe(1);
    expect((await Food.findByPk(gone.id)).archivedAt).toBeNull();
  });

  it('ne touche ni aux aliments perso ni aux produits Open Food Facts', async () => {
    const off = await createFood({ name: 'Produit', source: 'off', barcode: '12345678' });
    const report = await importCiqualFolder(folder);
    expect(report.archived).toBe(0);
    expect((await Food.findByPk(off.id)).archivedAt).toBeNull();
  });

  it('ne modifie rien si la liste est vide (mauvais fichiers)', async () => {
    await importCiqualFolder(folder);
    await expect(importCiqual([])).rejects.toThrow('Aucun aliment trouvé');
    expect(await Food.count({ where: { archivedAt: null } })).toBe(3);
  });

  it('dit quel fichier manque dans le dossier', async () => {
    await rm(join(folder, 'compo_2025_11_03.xml'));
    await expect(readCiqualFolder(folder)).rejects.toThrow('compo_….xml');
  });
});
