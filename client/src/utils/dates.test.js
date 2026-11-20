import { expect, it } from 'vitest';
import { formatHeure, formatJourMois, formatJusqua } from './dates.js';

it('écrit le jour et le mois en toutes lettres', () => {
  expect(formatJourMois('2026-11-26T12:00:00.000Z')).toBe('26 novembre');
});

it('écrit l’heure à la française', () => {
  expect(formatHeure(new Date(2026, 10, 26, 9, 5).toISOString())).toBe('9 h 05');
});

it('donne seulement l’heure quand le lien expire le jour même', () => {
  const now = new Date(2026, 10, 26, 13, 30);
  expect(formatJusqua(new Date(2026, 10, 26, 14, 30).toISOString(), now)).toBe('jusqu’à 14 h 30');
});

it('ajoute la date quand le lien expire un autre jour', () => {
  const now = new Date(2026, 10, 26, 23, 45);
  expect(formatJusqua(new Date(2026, 10, 27, 0, 45).toISOString(), now)).toBe(
    'jusqu’au 27 novembre à 0 h 45',
  );
});
