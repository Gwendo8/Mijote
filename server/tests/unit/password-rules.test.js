import { describe, expect, it } from 'vitest';
import { password } from '../../src/schemas/auth.schema.js';
import { hashPassword, verifyPassword } from '../../src/utils/password.js';

const messages = (value) => password.safeParse(value).error?.issues.map((i) => i.message) ?? [];

describe('règle de mot de passe', () => {
  it('accepte 8 caractères avec un chiffre et un caractère spécial', () => {
    expect(messages('Abcdef1!')).toEqual([]);
  });

  it('un message clair par règle non respectée', () => {
    expect(messages('Ab1!')).toEqual(['Le mot de passe doit contenir au moins 8 caractères']);
    expect(messages('Abcdefg!')).toEqual(['Le mot de passe doit contenir au moins un chiffre']);
    expect(messages('Abcdefg1')).toEqual([
      'Le mot de passe doit contenir au moins un caractère spécial (ex. ! ? - #)',
    ]);
  });
});

describe('hachage scrypt', () => {
  it('vérifie le bon mot de passe et refuse le mauvais', async () => {
    const hash = await hashPassword('Abcdef1!');
    expect(hash).not.toContain('Abcdef1!');
    expect(await verifyPassword('Abcdef1!', hash)).toBe(true);
    expect(await verifyPassword('Autre1234!', hash)).toBe(false);
  });

  it('refuse un hachage mal formé', async () => {
    expect(await verifyPassword('x', 'n-importe-quoi')).toBe(false);
  });
});
