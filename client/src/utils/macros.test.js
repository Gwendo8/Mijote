import { describe, expect, it } from 'vitest';
import { macroShares, ringGradient } from './macros.js';

describe('macroShares', () => {
  it('compte protéines et glucides × 4, lipides × 9', () => {
    const shares = macroShares({ proteins: 10, carbs: 10, fats: 20 }); // 40 + 40 + 180 = 260
    expect(shares.proteins).toBeCloseTo(15.38, 1);
    expect(shares.carbs).toBeCloseTo(15.38, 1);
    expect(shares.fats).toBeCloseTo(69.23, 1);
  });
  it('renvoie null sans aucun gramme', () => {
    expect(macroShares({})).toBeNull();
  });
  it('construit le dégradé de l’anneau', () => {
    expect(ringGradient({ proteins: 20, carbs: 30, fats: 50 })).toBe(
      'conic-gradient(var(--prot) 0 20%, var(--gluc) 20% 50%, var(--lip) 50% 100%)',
    );
  });
});

describe('anneau des listes (protéines seulement)', () => {
  it('montre la part des protéines et le reste en neutre', async () => {
    const { proteinOnlyShares, ringGradient } = await import('./macros.js');
    const shares = proteinOnlyShares(400, 25); // 100 kcal sur 400
    expect(shares.proteins).toBe(25);
    expect(shares.other).toBe(75);
    expect(ringGradient(shares)).toContain('var(--pointilles)');
    expect(proteinOnlyShares(null, 10)).toBeNull();
    expect(proteinOnlyShares(300, null)).toBeNull();
  });
});
