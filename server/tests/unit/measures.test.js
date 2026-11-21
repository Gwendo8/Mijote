import { describe, expect, it } from 'vitest';
import { matchedKeys, measuresFor } from '../../src/data/measures/index.js';
import usda from '../../src/data/measures/usda-measures.json' with { type: 'json' };

const water = { gramsPerMl: 1, gramsPerMlSource: 'water' };

describe('measuresFor : densités (volumes)', () => {
  it.each([
    ['Lait demi-écrémé, UHT', 1.031],
    ['Lait entier, pasteurisé', 1.031],
    ['Huile d’olive vierge extra', 0.913],
    ["Huile d'olive vierge extra", 0.913],
    ['Huile de tournesol', 0.921],
    ['Farine de blé tendre ou froment T55 (pour pains)', 0.528],
    ['Sucre blanc', 0.845],
    ['Miel', 1.433],
    ['Eau minérale (aliment moyen)', 1],
    ['Crème 30% MG, fluide, UHT', 1.006],
    ['Beurre à 80% MG, demi-sel', 0.959],
    ['Riz blanc, cru', 0.782],
    ['Vin rouge', 0.994],
    ['Fleur de sel, non iodée, non fluorée', 1.234],
  ])('%s → %d g/ml, valeur de référence', (name, expected) => {
    const m = measuresFor({ name });
    expect(m.gramsPerMl).toBe(expected);
    expect(m.gramsPerMlSource).toBe('reference');
    expect(m.source).toContain('USDA FoodData Central');
  });

  it('retrouve les valeurs clés de l’USDA (vérifiées dans food_portion)', () => {
    // 1 cup = 244 g de lait, 218 g d'huile de tournesol, 125 g de farine : 1 cup = 236,588 ml
    expect(usda.densities.lait_entier.gramsPerMl).toBeCloseTo(244 / 236.588, 3);
    expect(usda.densities.farine_ble.gramsPerMl).toBeCloseTo(125 / 236.588, 3);
    expect(usda.densities.huile_tournesol.gramsPerMl).toBeCloseTo(218 / 236.588, 3);
    expect(usda.pieces.oeuf.pieceGrams).toBe(50);
  });

  it('distingue les faux amis', () => {
    // lait de coco ≠ lait ; sucre glace ≠ sucre ; crème dessert ≠ crème
    expect(measuresFor({ name: 'Lait de coco' }).gramsPerMl).toBe(0.955);
    expect(measuresFor({ name: 'Sucre glace' }).gramsPerMl).toBe(0.507);
    expect(measuresFor({ name: 'Sucre roux' }).gramsPerMl).toBe(0.93);
    expect(matchedKeys({ name: 'Crème dessert au chocolat, rayon frais' }).density).toBeNull();
    expect(matchedKeys({ name: 'Crème brûlée, rayon frais' }).density).toBeNull();
    expect(matchedKeys({ name: 'Lait en poudre, écrémé' }).density).toBe('lait_poudre_ecreme');
    expect(matchedKeys({ name: 'Lait concentré sucré, entier' }).density).toBe(
      'lait_concentre_sucre',
    );
    expect(matchedKeys({ name: 'Riz blanc, cuit, sans sel ajouté' }).density).toBe('riz_cuit');
    expect(matchedKeys({ name: 'Farine de maïs' }).density).toBe('farine_mais');
    expect(matchedKeys({ name: 'Couscous au mouton' }).density).toBeNull();
    expect(matchedKeys({ name: 'Huile de foie de morue' }).density).toBeNull();
  });

  it('un aliment inconnu compte comme de l’eau, sans source', () => {
    expect(measuresFor({ name: 'Granola maison' })).toEqual({
      ...water,
      pieceGrams: null,
      source: null,
    });
    expect(measuresFor({ name: '' })).toMatchObject(water);
    expect(measuresFor({})).toMatchObject(water);
  });

  it('indique quand la valeur vient d’un aliment proche', () => {
    expect(measuresFor({ name: 'Farine de pois chiche' }).source).toContain('aliment proche');
    expect(measuresFor({ name: 'Farine de blé tendre ou froment T65' }).source).not.toContain(
      'proche',
    );
  });

  it('prend aussi la famille Ciqual en compte', () => {
    expect(measuresFor({ name: 'Naturelle', category: 'eaux' }).gramsPerMlSource).toBe('reference');
  });
});

describe('measuresFor : poids par pièce', () => {
  it.each([
    ['Oeuf cru', 50, '1 œuf (gros)'],
    ['Oeuf dur', 50, '1 œuf (gros)'],
    ['Oeuf, jaune (jaune d’oeuf), cru', 17, '1 jaune (gros œuf)'],
    ['Oeuf, blanc (blanc d’oeuf), cru', 33, '1 blanc (gros œuf)'],
    ['Ail, cru', 3, '1 gousse'],
    ['Oignon, cru', 110, '1 oignon moyen'],
    ['Oignon rouge, cru', 110, '1 oignon moyen'],
    ['Tomate ronde, crue', 123, '1 tomate moyenne'],
    ['Carotte, crue', 61, '1 carotte moyenne'],
    ['Pomme de terre nouvelle ou primeur, crue', 213, '1 pomme de terre moyenne'],
    ['Pomme, chair et peau, crue', 182, '1 pomme moyenne'],
    ['Banane, chair sans peau, crue', 118, '1 banane moyenne (sans la peau)'],
  ])('%s → %d g', (name, grams, label) => {
    const m = measuresFor({ name });
    expect(m.pieceGrams).toBe(grams);
    expect(m.pieceLabel).toBe(label);
    expect(m.source).toContain('pièce : fdc');
  });

  it('ne confond pas les œufs avec autre chose', () => {
    for (const name of [
      'Oeufs de lump',
      'Oeufs de poisson',
      "Oeuf d'oie, cru",
      'Oeuf de caille, cru',
      'Oeuf, en poudre',
      'Oeufs au lait, rayon frais',
      'Oeuf brouillé, avec matière grasse',
      'Omelette nature, faite maison',
    ]) {
      expect(measuresFor({ name }).pieceGrams, name).toBeNull();
    }
  });

  it('ne donne pas de poids de pièce aux produits transformés ou secs', () => {
    for (const name of [
      'Ail séché, poudre',
      'Oignon au vinaigre',
      'Oignon, séché',
      'Tomate, concentré, appertisé',
      'Tomate, séchée',
      'Carotte, râpée, assaisonnée',
      'Pomme de terre, sans peau, crue',
      'Pomme de terre dauphine, surgelée, cuite',
      'Abricot, dénoyauté, sec',
      'Figue de Barbarie, chair et peau, avec pépins',
      'Échalote, crue',
    ]) {
      expect(measuresFor({ name }).pieceGrams, name).toBeNull();
    }
  });

  it('n’ajoute pas pieceLabel quand le poids est inconnu', () => {
    expect('pieceLabel' in measuresFor({ name: 'Lait entier' })).toBe(false);
  });
});

describe('measuresFor : aliments Open Food Facts et perso', () => {
  it('marche sur le nom seul, sans famille', () => {
    expect(measuresFor({ name: 'Lait demi-écrémé UHT', category: null }).gramsPerMl).toBe(1.031);
    expect(
      measuresFor({ name: 'Huile d’olive vierge extra bio', category: 'Huiles' }).gramsPerMl,
    ).toBe(0.913);
    expect(measuresFor({ name: 'Oeufs frais' }).pieceGrams).toBe(50);
    expect(measuresFor({ name: 'Mon miel de la ruche' }).source).toBeNull();
  });
});

describe('usda-measures.json', () => {
  it('chaque entrée a sa source (identifiant fdc et mesure d’origine)', () => {
    for (const entry of [...Object.values(usda.densities), ...Object.values(usda.pieces)]) {
      expect(entry.fdcId).toBeTypeOf('number');
      expect(entry.usda).toBeTruthy();
      expect(entry.measure).toMatch(/=\s*[\d.]+ g$/);
    }
  });
});
