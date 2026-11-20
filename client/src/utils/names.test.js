import { describe, expect, it } from 'vitest';
import { displayNameFor, firstNameOf, fullName } from './names.js';

describe('fullName', () => {
  it('assemble prénom et nom', () => {
    expect(fullName({ firstName: 'Camille', lastName: 'Dupré' })).toBe('Camille Dupré');
  });
  it('sans espace en trop quand le nom est vide', () => {
    expect(fullName({ firstName: 'Camille', lastName: '' })).toBe('Camille');
    expect(fullName({ firstName: ' Camille ', lastName: '  ' })).toBe('Camille');
  });
  it('accepte une personne absente', () => {
    expect(fullName(null)).toBe('');
    expect(fullName({ firstName: 'Camille' })).toBe('Camille');
  });
});

describe('firstNameOf', () => {
  it('donne le prénom seul', () => {
    expect(firstNameOf({ firstName: 'Camille', lastName: 'Dupré' })).toBe('Camille');
    expect(firstNameOf(undefined)).toBe('');
  });
});

describe('displayNameFor', () => {
  const camille = { id: 1, firstName: 'Camille', lastName: 'Dupré' };
  it('soi-même par le prénom', () => {
    expect(displayNameFor(camille, 1)).toBe('Camille');
  });
  it('les autres en « Prénom Nom »', () => {
    expect(displayNameFor(camille, 2)).toBe('Camille Dupré');
  });
});
