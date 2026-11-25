import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../../test/axe.js';
import { alice, apiError, mockApi, renderApp, sentBody } from '../../test/helpers.jsx';

const lea = { id: 5, firstName: 'Léa', lastName: 'Durand' };
const nutrition = (k, p) => ({
  caloriesPerServing: k,
  proteinsPerServing: p,
  caloriesSource: k ? 'computed' : null,
  isComplete: k !== null,
  missingIngredients: k === null ? 1 : 0,
});
const short = (id, title, extra = {}) => ({
  id,
  kind: 'idea',
  title,
  servings: 1,
  prepTimeMinutes: null,
  cookTimeMinutes: null,
  photoUrl: null,
  visibility: 'private',
  owner: alice,
  isMine: true,
  tags: [],
  nutrition: nutrition(212, 27),
  ...extra,
});
const skyr = {
  id: 1,
  source: 'ciqual',
  name: 'Skyr nature',
  brand: null,
  energyKcal: 63,
  proteinsG: 11,
  carbsG: 4,
  fatsG: 0,
};
const detail = (extra = {}) => ({
  ...short(12, 'Bol skyr'),
  description: null,
  instructions: null,
  sourceUrl: null,
  copiedFrom: null,
  sharedWith: [],
  caloriesPerServingManual: null,
  proteinsPerServingManual: null,
  ingredients: [
    { id: 1, position: 0, label: 'Skyr nature', grams: 250, isNegligible: false, food: skyr },
  ],
  nutrition: {
    ...nutrition(158, 27),
    total: { calories: 158, proteins: 27, carbs: 10, fats: 0 },
    perServing: { calories: 158, proteins: 27, carbs: 10, fats: 0 },
  },
  ...extra,
});
const tags = [{ id: 1, name: 'Petit-déj', position: 0 }];
const page = (items) => ({ body: { items, total: items.length, page: 1, limit: 50 } });
const base = { 'GET /auth/me': { body: alice }, 'GET /tags': { body: tags } };
const LISTE = 'GET /recipes?kind=idea&scope=all&limit=50';

function setDesktop(matches) {
  window.matchMedia = vi.fn().mockImplementation(() => ({
    matches,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
}

afterEach(() => {
  vi.unstubAllGlobals();
  delete window.matchMedia;
});

describe.each([
  ['téléphone', false],
  ['PC', true],
])('Idées, liste (%s)', (_name, desktop) => {
  beforeEach(() => setDesktop(desktop));

  it('affiche les idées avec leurs calories, demande kind=idea, et est accessible', async () => {
    mockApi({
      ...base,
      [LISTE]: page([short(1, 'Bol skyr'), short(2, 'Wrap thon', { isMine: false, owner: lea })]),
    });
    const { container } = renderApp('/idees');
    expect(await screen.findByRole('heading', { name: 'Bol skyr' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Idées de plats', level: 1 })).toBeInTheDocument();
    expect(screen.getByText('2 idées')).toBeInTheDocument();
    expect(screen.getByText('de Léa Durand')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Bol skyr/ })).toHaveAttribute('href', '/idees/1');
    expect(screen.queryByText('Importer par lien')).not.toBeInTheDocument();
    await expectNoA11yViolations(container);
  });

  it('cherche une idée et dit quand rien ne correspond', async () => {
    mockApi({
      ...base,
      [LISTE]: page([short(1, 'Bol skyr')]),
      'GET /recipes?kind=idea&scope=all&q=pizza&limit=50': page([]),
    });
    renderApp('/idees');
    await screen.findByRole('heading', { name: 'Bol skyr' });
    await userEvent.type(screen.getByLabelText('Chercher une idée'), 'pizza');
    expect(await screen.findByText('Aucune idée')).toBeInTheDocument();
  });

  it('invite à créer la première idée quand il n’y en a aucune', async () => {
    mockApi({ ...base, [LISTE]: page([]) });
    renderApp('/idees');
    expect(await screen.findByText('Créer une idée')).toBeInTheDocument();
  });

  it('dit une phrase claire si le chargement échoue, avec « Réessayer »', async () => {
    mockApi({ ...base, [LISTE]: apiError(500, 'Erreur du serveur') });
    renderApp('/idees');
    expect(await screen.findByRole('button', { name: 'Réessayer' })).toBeInTheDocument();
  });
});

describe('Idées, fiche', () => {
  beforeEach(() => setDesktop(false));

  it('affiche les aliments avec leur source, leurs grammes et leurs calories', async () => {
    mockApi({ ...base, 'GET /recipes/12': { body: detail() } });
    const { container } = renderApp('/idees/12');
    expect(await screen.findByRole('heading', { name: 'Bol skyr' })).toBeInTheDocument();
    expect(screen.getByText('idée de plat, 1 part')).toBeInTheDocument();
    expect(screen.getByText('Dans l’assiette')).toBeInTheDocument();
    expect(screen.getByText('Ciqual, 250 g')).toBeInTheDocument();
    expect(screen.getAllByText('158').length).toBeGreaterThan(0);
    expect(screen.getByText('158 kcal')).toBeInTheDocument();
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Modifier' })).toHaveAttribute(
      'href',
      '/idees/12/modifier',
    );
    await expectNoA11yViolations(container);
  });

  it('montre le calcul et la correction à la main', async () => {
    mockApi({
      ...base,
      'GET /recipes/12': {
        body: detail({
          caloriesPerServingManual: 140,
          nutrition: { ...detail().nutrition, caloriesPerServing: 140, caloriesSource: 'manual' },
        }),
      },
    });
    renderApp('/idees/12');
    expect(await screen.findByText('calcul')).toBeInTheDocument();
    expect(screen.getByText('corrigé à la main')).toBeInTheDocument();
    expect(screen.getByText('140 kcal')).toBeInTheDocument();
  });

  it('« Revenir au calcul » efface la correction à la main (envoi complet de l’idée)', async () => {
    const corrected = detail({
      caloriesPerServingManual: 140,
      nutrition: { ...detail().nutrition, caloriesPerServing: 140, caloriesSource: 'manual' },
    });
    const fetchMock = mockApi({
      ...base,
      'GET /recipes/12': { body: corrected },
      'PUT /recipes/12': { body: detail() },
    });
    renderApp('/idees/12');
    expect(await screen.findByText(/140 au lieu de 158 calculées/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Revenir au calcul' }));
    await waitFor(() => expect(sentBody(fetchMock, 'PUT /recipes/12')).toBeDefined());
    const body = sentBody(fetchMock, 'PUT /recipes/12');
    expect(body).toMatchObject({
      caloriesPerServingManual: null,
      proteinsPerServingManual: null,
      title: 'Bol skyr',
    });
    expect(await screen.findByText('Les calories sont revenues au calcul.')).toBeInTheDocument();
  });

  it('pas de réglage des parts pour une idée d’une seule part, ni d’étapes', async () => {
    mockApi({ ...base, 'GET /recipes/12': { body: detail() } });
    renderApp('/idees/12');
    await screen.findByRole('heading', { name: 'Bol skyr' });
    expect(screen.queryByRole('button', { name: 'Une part de plus' })).not.toBeInTheDocument();
    expect(screen.queryByText(/Aucune étape/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Revenir au calcul' })).not.toBeInTheDocument();
  });

  it('idée d’une autre personne : « Copier chez moi », la copie s’ouvre dans les idées', async () => {
    mockApi({
      ...base,
      'GET /recipes/12': { body: detail({ isMine: false, owner: lea }) },
      'POST /recipes/12/copy': { status: 201, body: detail({ id: 20 }) },
      'GET /recipes/20': { body: detail({ id: 20 }) },
    });
    const { router } = renderApp('/idees/12');
    await screen.findByRole('heading', { name: 'Bol skyr' });
    expect(screen.queryByRole('link', { name: 'Modifier' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Copier chez moi' }));
    expect(await screen.findByText(/Idée copiée chez toi/)).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/idees/20');
  });

  it('supprime après confirmation et revient à la liste des idées', async () => {
    const fetchMock = mockApi({
      ...base,
      'GET /recipes/12': { body: detail() },
      'DELETE /recipes/12': { status: 204 },
      [LISTE]: page([]),
    });
    const { router } = renderApp('/idees/12');
    await userEvent.click(await screen.findByRole('button', { name: 'Supprimer l’idée' }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: /Supprimer « Bol skyr »/ }));
    expect(await screen.findByText(/« Bol skyr » est supprimée/)).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/idees');
    expect(fetchMock.mock.calls.some(([, o]) => o?.method === 'DELETE')).toBe(true);
  });

  it('partage avec une personne choisie : l’idée entière est renvoyée', async () => {
    const fetchMock = mockApi({
      ...base,
      'GET /recipes/12': { body: detail() },
      'GET /users/search?q=le': { body: [lea] },
      'PUT /recipes/12': { body: detail({ visibility: 'shared' }) },
    });
    renderApp('/idees/12');
    await userEvent.click(await screen.findByRole('button', { name: 'Partager' }));
    expect(screen.getByText(/Les autres peuvent voir l’idée/)).toBeInTheDocument();
    await userEvent.click(screen.getByLabelText(/Des personnes choisies/));
    await userEvent.type(screen.getByLabelText('Chercher une personne par son nom'), 'le');
    await userEvent.click(await screen.findByRole('button', { name: 'Ajouter Léa Durand' }));
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer le partage' }));
    await waitFor(() => expect(sentBody(fetchMock, 'PUT /recipes/12')).toBeDefined());
    const body = sentBody(fetchMock, 'PUT /recipes/12');
    expect(body).toMatchObject({ visibility: 'shared', sharedWith: [5], title: 'Bol skyr' });
    expect(body.ingredients[0]).toMatchObject({ foodId: 1, grams: 250 });
  });

  it('dit une phrase claire si l’idée est introuvable', async () => {
    mockApi({ ...base, 'GET /recipes/99': apiError(404, 'Introuvable') });
    renderApp('/idees/99');
    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });

  it('dit « Idée introuvable » si le numéro est celui d’une recette, et inversement', async () => {
    const recette = detail({ id: 30, kind: 'recipe' });
    mockApi({
      ...base,
      'GET /recipes/30': { body: recette },
      'GET /recipes/31': { body: detail({ id: 31 }) },
    });
    const { unmount } = renderApp('/idees/30');
    expect(await screen.findByText(/Idée introuvable/)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: recette.title })).not.toBeInTheDocument();
    unmount();
    renderApp('/recettes/31/modifier');
    expect(await screen.findByText(/Recette introuvable/)).toBeInTheDocument();
  });
});

describe('Idées, création et modification', () => {
  beforeEach(() => setDesktop(false));

  it('exige un aliment avec ses grammes avant tout envoi', async () => {
    const fetchMock = mockApi(base);
    const { container } = renderApp('/idees/nouveau');
    await userEvent.click(
      (await screen.findAllByRole('button', { name: 'Enregistrer l’idée' })).at(-1),
    );
    expect(await screen.findByText('Le titre est obligatoire')).toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([, o]) => o?.method === 'POST')).toBe(false);
    expect(screen.queryByLabelText('Prépa.')).not.toBeInTheDocument();
    expect(screen.queryByText('Étapes')).not.toBeInTheDocument();
    await expectNoA11yViolations(container);
  });

  it('compose une assiette, l’enregistre avec kind=idea et ouvre sa fiche', async () => {
    const fetchMock = mockApi({
      ...base,
      'GET /foods?q=skyr&limit=50': { body: { items: [skyr], total: 1 } },
      'POST /recipes': { status: 201, body: detail() },
      'GET /recipes/12': { body: detail() },
    });
    const { router } = renderApp('/idees/nouveau');
    await userEvent.type(await screen.findByLabelText('Nom de l’assiette'), 'Bol skyr');
    await userEvent.click(screen.getByRole('button', { name: 'Ajouter un aliment' }));
    const fenetre = await screen.findByRole('dialog', { name: 'Ajouter un aliment' });
    await userEvent.type(within(fenetre).getByLabelText('Chercher un aliment'), 'skyr');
    await userEvent.click(await within(fenetre).findByRole('button', { name: /Skyr nature/ }));
    await userEvent.clear(within(fenetre).getByLabelText('Poids (g)'));
    await userEvent.type(within(fenetre).getByLabelText('Poids (g)'), '250');
    await userEvent.click(within(fenetre).getByRole('button', { name: 'Ajouter' }));
    await userEvent.click(screen.getAllByRole('button', { name: 'Enregistrer l’idée' }).at(-1));
    expect(await screen.findByText('Idée enregistrée.')).toBeInTheDocument();
    const body = sentBody(fetchMock, 'POST /recipes');
    expect(body).toMatchObject({
      kind: 'idea',
      title: 'Bol skyr',
      instructions: null,
      prepTimeMinutes: null,
      cookTimeMinutes: null,
    });
    expect(body.ingredients[0]).toMatchObject({ foodId: 1, grams: 250 });
    expect(router.state.location.pathname).toBe('/idees/12');
  });

  it('montre sous le bon champ une erreur renvoyée par l’API', async () => {
    mockApi({
      ...base,
      'GET /recipes/12': { body: detail() },
      'PUT /recipes/12': apiError(400, 'Données invalides', [
        { path: ['title'], message: 'Ce titre est trop long' },
      ]),
    });
    renderApp('/idees/12/modifier');
    await screen.findByDisplayValue('Bol skyr');
    await userEvent.click(screen.getAllByRole('button', { name: 'Enregistrer l’idée' }).at(-1));
    expect(await screen.findByText('Ce titre est trop long')).toBeInTheDocument();
  });

  it('modifie une idée : titre prérempli, retour sur sa fiche', async () => {
    const fetchMock = mockApi({
      ...base,
      'GET /recipes/12': { body: detail() },
      'PUT /recipes/12': { body: detail({ title: 'Bol skyr fruits' }) },
    });
    const { router } = renderApp('/idees/12/modifier');
    const titre = await screen.findByLabelText('Nom de l’assiette');
    expect(titre).toHaveValue('Bol skyr');
    await userEvent.type(titre, ' fruits');
    await userEvent.click(screen.getAllByRole('button', { name: 'Enregistrer l’idée' }).at(-1));
    await waitFor(() => expect(router.state.location.pathname).toBe('/idees/12'));
    expect(sentBody(fetchMock, 'PUT /recipes/12').title).toBe('Bol skyr fruits');
  });

  it('idée d’une autre personne : pas de modification possible', async () => {
    mockApi({ ...base, 'GET /recipes/12': { body: detail({ isMine: false, owner: lea }) } });
    renderApp('/idees/12/modifier');
    expect(await screen.findByText(/Cette idée n’est pas à toi/)).toBeInTheDocument();
  });
});
