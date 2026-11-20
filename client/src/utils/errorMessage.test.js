import { describe, expect, it } from 'vitest';
import { ApiError } from '../services/api.js';
import { getErrorMessage, getFieldErrors } from './errorMessage.js';

describe('getErrorMessage', () => {
  it('traduit un serveur injoignable en phrase claire', () => {
    expect(getErrorMessage(new ApiError(0, 'Serveur injoignable'))).toMatch(/joindre le serveur/);
  });

  it("n'affiche jamais le message technique d'une erreur serveur", () => {
    expect(getErrorMessage(new ApiError(500, 'Internal Server Error'))).not.toMatch(/Internal/);
  });

  it('garde le message métier du back pour un conflit', () => {
    expect(getErrorMessage(new ApiError(409, 'Cet email est déjà utilisé'))).toBe(
      'Cet email est déjà utilisé',
    );
  });
});

describe('getFieldErrors', () => {
  it('associe chaque message au champ concerné', () => {
    const error = new ApiError(400, 'Données invalides', [
      { path: ['email'], message: 'Adresse email invalide' },
      { path: ['email'], message: 'Deuxième message ignoré' },
      { path: ['address', 'city'], message: 'Ville obligatoire' },
    ]);

    expect(getFieldErrors(error)).toEqual({
      email: 'Adresse email invalide',
      'address.city': 'Ville obligatoire',
    });
  });
});

describe('getErrorMessage (401)', () => {
  it('garde le motif écrit par le back', () => {
    expect(getErrorMessage(new ApiError(401, 'Mot de passe incorrect'))).toBe(
      'Mot de passe incorrect',
    );
  });

  it('retombe sur une phrase de session expirée sans motif', () => {
    expect(getErrorMessage(new ApiError(401, 'Erreur 401'))).toMatch(/session a expiré/);
  });
});
