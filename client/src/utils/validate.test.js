import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { validate } from './validate.js';

const schema = z.object({
  email: z.email({ error: 'Adresse invalide' }),
  name: z.string().min(1, { error: 'Nom obligatoire' }),
});

describe('validate', () => {
  it('renvoie les données quand tout est bon', () => {
    expect(validate(schema, { email: 'a@b.fr', name: 'A' })).toEqual({
      data: { email: 'a@b.fr', name: 'A' },
    });
  });
  it('renvoie un message par champ', () => {
    expect(validate(schema, { email: 'x', name: '' }).errors).toEqual({
      email: 'Adresse invalide',
      name: 'Nom obligatoire',
    });
  });
});
