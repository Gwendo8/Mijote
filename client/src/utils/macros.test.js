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
