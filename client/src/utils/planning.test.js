import { describe, expect, it } from 'vitest';
import {
  addDays,
  formatNombre,
  formatParts,
  formatSemaine,
  groupBySlot,
  jourComplet,
  mondayOf,
  resumeSemaine,
  weekDays,
} from './planning.js';

describe('dates du planning', () => {
  it('trouve le lundi de la semaine, dimanche compris', () => {
    expect(mondayOf('2026-11-19')).toBe('2026-11-16');
    expect(mondayOf('2026-11-16')).toBe('2026-11-16');
    expect(mondayOf('2026-11-22')).toBe('2026-11-16');
  });

  it('ajoute des jours en changeant de mois et d’année', () => {
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-11-16', -7)).toBe('2026-11-09');
  });

  it('liste les sept jours de la semaine', () => {
    expect(weekDays('2026-11-16')).toEqual([
      '2026-11-16',
      '2026-11-17',
      '2026-11-18',
      '2026-11-19',
      '2026-11-20',
      '2026-11-21',
      '2026-11-22',
    ]);
  });

  it('écrit la semaine et le jour en français', () => {
    expect(formatSemaine('2026-11-16')).toBe('16 au 22 novembre');
    expect(formatSemaine('2026-11-30')).toBe('30 novembre au 6 décembre');
    expect(jourComplet('2026-11-19')).toBe('jeudi 19 novembre');
  });
});

describe('affichages', () => {
  it('écrit les nombres à la française', () => {
    expect(formatNombre(1495).replace(/\s/g, ' ')).toBe('1 495');
    expect(formatNombre(80.4)).toBe('80');
    expect(formatNombre(null)).toBeNull();
    expect(formatParts(1.5)).toBe('1,5');
  });

  it('regroupe par créneau et ignore les créneaux vides', () => {
    const slots = [
      { id: 1, name: 'Petit-déj' },
      { id: 2, name: 'Midi' },
      { id: 3, name: 'Soir' },
    ];
    const entries = [
      { id: 10, slotId: 3 },
      { id: 11, slotId: 1 },
      { id: 12, slotId: 3 },
    ];
    const groups = groupBySlot(entries, slots);
    expect(groups.map((g) => g.slot.name)).toEqual(['Petit-déj', 'Soir']);
    expect(groups[1].entries.map((e) => e.id)).toEqual([10, 12]);
  });

  it('résume la semaine sans diviser par zéro', () => {
    const vide = { days: [{ entries: [] }], totals: { calories: 0, proteins: 0 } };
    expect(resumeSemaine(vide).moyenne).toBeNull();
    const week = {
      days: [{ entries: [1] }, { entries: [] }, { entries: [1] }],
      totals: { calories: 2000, proteins: 100, unknownCount: 1 },
    };
    expect(resumeSemaine(week)).toMatchObject({ joursRemplis: 2, moyenne: 1000, inconnues: 1 });
  });
});
