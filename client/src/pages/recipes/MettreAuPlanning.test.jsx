import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { alice, mockApi, renderApp, sentBody } from '../../test/helpers.jsx';

const lea = { id: 5, firstName: 'Léa', lastName: 'Durand' };
const slots = [
  { id: 1, name: 'Petit-déj', position: 0, isDefault: true, isHidden: false },
  { id: 2, name: 'Midi', position: 1, isDefault: true, isHidden: false },
  { id: 3, name: 'Soir', position: 2, isDefault: true, isHidden: true },
];
const fiche = (extra = {}) => ({
  id: 12,
  kind: 'recipe',
  title: 'Poulet citron',
  description: null,
  instructions: 'Cuire.',
  servings: 4,
  prepTimeMinutes: null,
  cookTimeMinutes: null,
  sourceUrl: null,
  photoUrl: null,
  visibility: 'private',
  owner: alice,
  isMine: true,
  sharedWith: [],
  copiedFrom: null,
  tags: [],
  ingredients: [],
  nutrition: {
    caloriesPerServing: 190,
    proteinsPerServing: 37,
    caloriesSource: 'computed',
    isComplete: true,
    missingIngredients: 0,
    total: { calories: 760, proteins: 148, carbs: 0, fats: 17 },
    perServing: { calories: 190, proteins: 37, carbs: 0, fats: 4 },
  },
  ...extra,
});
const base = {
  'GET /auth/me': { body: alice },
  'GET /tags': { body: [] },
  'GET /planning/slots': { body: slots },
};

afterEach(() => vi.unstubAllGlobals());

describe('Mettre au planning depuis une fiche', () => {
  it('place la recette un jour, dans un créneau visible, avec ses parts', async () => {
    const fetchMock = mockApi({
      ...base,
      'GET /recipes/12': { body: fiche() },
      'POST /planning/entries': { status: 201, body: { id: 1 } },
    });
    renderApp('/recettes/12');
    await userEvent.click(await screen.findByRole('button', { name: 'Mettre au planning' }));
    const fenetre = await screen.findByRole('dialog');
    // Le créneau masqué (Soir) n'est pas proposé
    expect(await within(fenetre).findByRole('button', { name: 'Midi' })).toBeInTheDocument();
    expect(within(fenetre).queryByRole('button', { name: 'Soir' })).not.toBeInTheDocument();
    await userEvent.click(within(fenetre).getByRole('button', { name: 'Midi' }));
    const jour = within(fenetre).getByLabelText('Jour');
    await userEvent.clear(jour);
    await userEvent.type(jour, '2026-11-19');
    await userEvent.click(within(fenetre).getByRole('button', { name: 'Une part de plus' }));
    await userEvent.click(within(fenetre).getByRole('button', { name: 'Mettre au planning' }));
    expect(await screen.findByText(/est au planning, jeudi 19 novembre/)).toBeInTheDocument();
    expect(sentBody(fetchMock, 'POST /planning/entries')).toEqual({
      date: '2026-11-19',
      slotId: 2,
      recipeId: 12,
      servings: 1.5,
    });
    expect(screen.getByRole('link', { name: 'Voir le planning' })).toHaveAttribute(
      'href',
      '/planning?j=2026-11-19',
    );
  });

  it('propose de copier la recette d’une autre personne après l’ajout', async () => {
    mockApi({
      ...base,
      'GET /recipes/12': { body: fiche({ isMine: false, owner: lea }) },
      'POST /planning/entries': { status: 201, body: { id: 1 } },
    });
    renderApp('/recettes/12');
    await userEvent.click(await screen.findByRole('button', { name: 'Mettre au planning' }));
    const fenetre = await screen.findByRole('dialog');
    await within(fenetre).findByRole('button', { name: 'Midi' });
    await userEvent.click(within(fenetre).getByRole('button', { name: 'Mettre au planning' }));
    expect(await screen.findByText(/Copier chez moi pour la garder \?/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Non merci' }));
    await waitFor(() =>
      expect(screen.getByRole('link', { name: 'Voir le planning' })).toBeVisible(),
    );
  });
});
