import { describe, expect, it } from 'vitest';
import { calculerGrammes, lireQuantite } from './quantites.js';

const g = (ligne) => lireQuantite(ligne)?.grammes;
const ml = (ligne) => lireQuantite(ligne)?.ml;

describe('lireQuantite', () => {
  it('lit les masses', () => {
    expect(g('200 g de farine')).toBe(200);
    expect(g('200g de farine')).toBe(200);
    expect(g('150 gr de sucre')).toBe(150);
    expect(g('1 gramme de sel')).toBe(1);
    expect(g('1,5 kg de pommes de terre')).toBe(1500);
    expect(g('500 mg de safran')).toBe(0.5);
    expect(g('0.5 kg de riz')).toBe(500);
  });

  it('lit les volumes', () => {
    expect(ml('20 cl de lait')).toBe(200);
    expect(ml('250 ml de crème')).toBe(250);
    expect(ml('2 dl de vin')).toBe(200);
    expect(ml('1 l de bouillon')).toBe(1000);
    expect(ml('1,5 litres d’eau')).toBe(1500);
    expect(ml('1 tasse de lait')).toBeCloseTo(236.588);
  });

  it('lit les cuillères', () => {
    for (const ligne of [
      '3 c. à soupe d’huile',
      '3 cuillères à soupe d’huile',
      '3 cuillère à soupe d’huile',
      '3 c.à.s d’huile',
      '3 cs d’huile',
      '3 càs d’huile',
    ]) {
      expect(ml(ligne)).toBeCloseTo(3 * 14.787);
    }
    for (const ligne of [
      '2 c. à café de sel',
      '2 cuillères à café de sel',
      '2 cc de sel',
      '2 càc de sel',
    ]) {
      expect(ml(ligne)).toBeCloseTo(2 * 4.929);
    }
  });

  it('lit les fractions et les décimaux', () => {
    expect(ml('1/2 l de lait')).toBe(500);
    expect(ml('½ l de lait')).toBe(500);
    expect(ml('1 1/2 l de lait')).toBe(1500);
    expect(ml('1½ l de lait')).toBe(1500);
    expect(g('0,25 kg de beurre')).toBe(250);
  });

  it('lit les pièces', () => {
    expect(lireQuantite('2 œufs')).toMatchObject({ type: 'pieces', nombre: 2 });
    expect(lireQuantite('1 oignon')).toMatchObject({ type: 'pieces', nombre: 1 });
    expect(lireQuantite('3 gousses d’ail')).toMatchObject({ type: 'pieces', nombre: 3 });
    expect(lireQuantite('un oignon')).toMatchObject({ type: 'pieces', nombre: 1 });
    expect(lireQuantite('1/2 citron')).toMatchObject({ type: 'pieces', nombre: 0.5 });
  });

  it('ne se trompe pas sur les pièges', () => {
    expect(g('2 x 100 g de chocolat')).toBe(200);
    expect(g('1 boîte de 400 g de tomates')).toBe(400);
    expect(g('2 boîtes de 400 g de tomates')).toBe(800);
    expect(g('2 oignons (200 g)')).toBe(200);
    expect(lireQuantite('farine T55')).toBeNull();
    expect(g('farine 200 g')).toBe(200);
    expect(g('4 filets de poulet (600 g)')).toBe(600);
  });

  it('refuse ce qu’on ne sait pas convertir', () => {
    for (const ligne of [
      '1 boîte de thon',
      '1 pincée de sel',
      'une pincée de sel',
      '1 filet d’huile',
      '1 sachet de levure',
      '1 verre de lait',
      '1 botte de persil',
      'un peu de beurre',
      'quelques feuilles de menthe',
      '2 tranches de jambon',
      '3-4 oignons',
      'sel',
      '',
      '2',
      null,
    ]) {
      expect(lireQuantite(ligne)).toBeNull();
    }
  });
});

const lait = { gramsPerMl: 1.031, gramsPerMlSource: 'reference', pieceGrams: null, source: 'USDA' };
const oeuf = {
  gramsPerMl: 1,
  gramsPerMlSource: 'water',
  pieceGrams: 50,
  pieceLabel: '1 œuf (gros)',
  source: 'USDA',
};

describe('calculerGrammes', () => {
  it('convertit une masse sans connaître l’aliment', () => {
    expect(calculerGrammes(lireQuantite('200 g de farine'), null)).toMatchObject({
      grammes: 200,
      estime: false,
    });
    expect(calculerGrammes(lireQuantite('1,5 kg de farine'), undefined).grammes).toBe(1500);
  });

  it('convertit un volume avec la densité', () => {
    const calcul = calculerGrammes(lireQuantite('20 cl de lait'), lait);
    expect(calcul).toEqual({ grammes: 206, explication: '20 cl → 206 g', estime: false });
  });

  it('signale la densité estimée comme l’eau', () => {
    expect(calculerGrammes(lireQuantite('20 cl de truc'), oeuf)).toMatchObject({
      grammes: 200,
      estime: true,
    });
  });

  it('convertit des pièces avec le poids d’une pièce', () => {
    expect(calculerGrammes(lireQuantite('2 œufs'), oeuf)).toEqual({
      grammes: 100,
      explication: '2 × 1 œuf (gros) = 100 g',
      estime: false,
    });
  });

  it('ne calcule pas sans poids de pièce, sans mesures ou sans quantité', () => {
    expect(calculerGrammes(lireQuantite('2 œufs'), lait)).toBeNull();
    expect(calculerGrammes(lireQuantite('20 cl de lait'), null)).toBeNull();
    expect(calculerGrammes(null, lait)).toBeNull();
  });
});

describe('texte affiché', () => {
  it('écrit la quantité lue avec ses accents', () => {
    expect(lireQuantite('3 c.à.s d’huile').texte).toBe('3 c. à soupe');
    expect(lireQuantite('2 cc de sel').texte).toBe('2 c. à café');
    expect(lireQuantite('1,5 l d’eau').texte).toBe('1,5 l');
    expect(lireQuantite('2 x 100 g de chocolat').texte).toBe('2 × 100 g');
    expect(lireQuantite('2 boîtes de 400 g de tomates').texte).toBe('2 × 400 g');
  });
});
