import { describe, expect, it } from 'vitest';
import {
  parseDuration,
  parseRecipePage,
  parseServings,
} from '../../src/utils/recipe-schema-org.js';

const page = (json) =>
  `<html><head><script type="application/ld+json">${JSON.stringify(json)}</script></head></html>`;

describe('parseDuration', () => {
  it('convertit les durées ISO 8601 en minutes', () => {
    expect(parseDuration('PT1H30M')).toBe(90);
    expect(parseDuration('PT45M')).toBe(45);
    expect(parseDuration('P1DT2H')).toBe(1560);
    expect(parseDuration('PT0M')).toBeNull();
    expect(parseDuration('une heure')).toBeNull();
    expect(parseDuration(undefined)).toBeNull();
  });
});

describe('parseServings', () => {
  it('prend le premier nombre, sinon 1', () => {
    expect(parseServings('4 personnes')).toBe(4);
    expect(parseServings(6)).toBe(6);
    expect(parseServings(['', '8 parts'])).toBe(8);
    expect(parseServings('plusieurs')).toBe(1);
    expect(parseServings(undefined)).toBe(1);
  });
});

describe('parseRecipePage', () => {
  it('lit une fiche Recipe dans un @graph', () => {
    const draft = parseRecipePage(
      page({
        '@context': 'https://schema.org',
        '@graph': [
          { '@type': 'WebSite', name: 'Site' },
          {
            '@type': ['Recipe'],
            name: 'Tarte &amp; cie',
            description: '<p>Très bonne</p>',
            recipeYield: ['6', '6 parts'],
            prepTime: 'PT15M',
            cookTime: 'PT1H',
            image: [{ '@type': 'ImageObject', url: '/img/tarte.jpg' }],
            recipeIngredient: ['200 g de farine', '  ', '3 œufs'],
            recipeInstructions: [
              { '@type': 'HowToStep', text: 'Mélanger.' },
              {
                '@type': 'HowToSection',
                itemListElement: [{ '@type': 'HowToStep', text: 'Cuire.' }],
              },
              'Servir.',
            ],
          },
        ],
      }),
      'https://exemple.fr/tarte',
    );
    expect(draft).toEqual({
      title: 'Tarte & cie',
      description: 'Très bonne',
      instructions: 'Mélanger.\nCuire.\nServir.',
      servings: 6,
      prepTimeMinutes: 15,
      cookTimeMinutes: 60,
      sourceUrl: 'https://exemple.fr/tarte',
      imageUrl: 'https://exemple.fr/img/tarte.jpg',
      ingredients: [{ label: '200 g de farine' }, { label: '3 œufs' }],
    });
  });

  it('passe les blocs mal formés et renvoie null sans fiche Recipe', () => {
    const broken = '<script type="application/ld+json">{ pas du json</script>';
    expect(parseRecipePage(broken, 'https://exemple.fr')).toBeNull();
    expect(parseRecipePage(page({ '@type': 'Article' }), 'https://exemple.fr')).toBeNull();
    expect(parseRecipePage('<html></html>', 'https://exemple.fr')).toBeNull();
    const second = broken + page({ '@type': 'Recipe', name: 'Soupe' });
    expect(parseRecipePage(second, 'https://exemple.fr').title).toBe('Soupe');
  });
});
