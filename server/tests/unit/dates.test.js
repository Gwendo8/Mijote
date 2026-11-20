import { describe, expect, it } from 'vitest';
import { addDays, isValidDate, mondayOf } from '../../src/utils/dates.js';
import { insertAt } from '../../src/utils/positions.js';

describe('dates', () => {
  it('reconnaît les vraies dates', () => {
    expect(isValidDate('2026-11-20')).toBe(true);
    expect(isValidDate('2026-02-30')).toBe(false);
    expect(isValidDate('20/11/2026')).toBe(false);
    expect(isValidDate(undefined)).toBe(false);
  });

  it('trouve le lundi de la semaine (dimanche compris)', () => {
    expect(mondayOf('2026-11-16')).toBe('2026-11-16');
    expect(mondayOf('2026-11-20')).toBe('2026-11-16');
    expect(mondayOf('2026-11-22')).toBe('2026-11-16');
    expect(mondayOf('2026-11-23')).toBe('2026-11-23');
  });

  it('ajoute des jours en passant les fins de mois et d’année', () => {
    expect(addDays('2026-11-28', 6)).toBe('2026-12-04');
    expect(addDays('2026-12-29', 6)).toBe('2027-01-04');
  });
});

describe('insertAt', () => {
  it('place l’élément à la position voulue, ou à la fin', () => {
    expect(insertAt(['a', 'b'], 'x', 0)).toEqual(['x', 'a', 'b']);
    expect(insertAt(['a', 'b'], 'x', 1)).toEqual(['a', 'x', 'b']);
    expect(insertAt(['a', 'b'], 'x', 99)).toEqual(['a', 'b', 'x']);
    expect(insertAt(['a', 'b'], 'x')).toEqual(['a', 'b', 'x']);
  });
});
