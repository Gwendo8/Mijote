import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../../test/axe.js';
import { admin, alice, apiError, mockApi, renderApp, sentBody } from '../../test/helpers.jsx';

const skyr = {
  id: 1,
  source: 'ciqual',
  name: 'Skyr nature',
  brand: null,
  category: 'produits laitiers frais',
  barcode: null,
  energyKcal: 63,
  proteinsG: 11,
  carbsG: 4,
  fatsG: 0.2,
  isCorrected: false,
  isMine: false,
};
const siggis = {
  ...skyr,
  id: 2,
  source: 'off',
  name: 'Skyr nature 0 %',
  brand: "Siggi's",
  category: null,
  energyKcal: 57,
  proteinsG: 12,
};
const mine = { ...skyr, id: 4, source: 'user', name: 'Skyr maison', category: null, isMine: true };
const page = (items) => ({ body: { items, total: items.length, page: 1, limit: 50 } });

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
])('Aliments, recherche (%s)', (_name, desktop) => {
  beforeEach(() => setDesktop(desktop));

  it('invite à chercher tant qu’il n’y a pas 2 lettres, et est accessible', async () => {
    mockApi({ 'GET /auth/me': { body: alice } });
    const { container } = renderApp('/aliments');
    expect(await screen.findByText('Cherche un aliment')).toBeInTheDocument();
    await expectNoA11yViolations(container);
  });

  it('affiche les résultats avec leurs valeurs, sans accents ni majuscules', async () => {
    const fetchMock = mockApi({
      'GET /auth/me': { body: alice },
      'GET /foods?q=skyr&limit=50': page([skyr, siggis]),
    });
    const { container } = renderApp('/aliments?q=skyr');
    expect(await screen.findByText('Skyr nature')).toBeInTheDocument();
    expect(screen.getByText("Skyr nature 0 %, Siggi's")).toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([u]) => String(u).includes('q=skyr'))).toBe(true);
    await expectNoA11yViolations(container);
  });

  it('dit quand rien ne correspond', async () => {
    mockApi({ 'GET /auth/me': { body: alice }, 'GET /foods?q=zzz&limit=50': page([]) });
    renderApp('/aliments?q=zzz');
    expect(await screen.findByText('Aucun résultat')).toBeInTheDocument();
  });

  it('affiche une phrase claire si la recherche échoue', async () => {
    mockApi({ 'GET /auth/me': { body: alice }, 'GET /foods?q=skyr&limit=50': apiError(500, 'x') });
    renderApp('/aliments?q=skyr');
    expect(await screen.findByText(/erreur est survenue/)).toBeInTheDocument();
  });

  it('« Mes aliments » liste mes aliments, ou invite à en créer', async () => {
    mockApi({ 'GET /auth/me': { body: alice }, 'GET /foods/mine?limit=50': page([]) });
    renderApp('/aliments?f=user');
    expect(await screen.findByText(/pas encore créé d’aliment/)).toBeInTheDocument();
  });

  it('ajoute à la liste les produits trouvés chez Open Food Facts', async () => {
    mockApi({
      'GET /auth/me': { body: alice },
      'GET /foods?q=skyr&limit=50': page([skyr]),
      'GET /foods/off/search?q=skyr': page([siggis]),
    });
    renderApp('/aliments?q=skyr');
    await screen.findByText('Skyr nature');
    await userEvent.click(screen.getByRole('button', { name: /Open Food Facts/ }));
    expect(await screen.findByText("Skyr nature 0 %, Siggi's")).toBeInTheDocument();
  });

  it('cherche tout seul chez Open Food Facts quand la base trouve moins de 3 aliments', async () => {
    const fetchMock = mockApi({
      'GET /auth/me': { body: alice },
      'GET /foods?q=skyr&limit=50': page([skyr]),
      'GET /foods/off/search?q=skyr': page([siggis]),
    });
    renderApp('/aliments?q=skyr');
    expect(
      await screen.findByText("Skyr nature 0 %, Siggi's", {}, { timeout: 3000 }),
    ).toBeInTheDocument();
    const offCalls = fetchMock.mock.calls.filter(([u]) => String(u).includes('/off/search'));
    expect(offCalls).toHaveLength(1);
  });

  it('ne dérange pas Open Food Facts quand la base trouve assez d’aliments', async () => {
    const fetchMock = mockApi({
      'GET /auth/me': { body: alice },
      'GET /foods?q=skyr&limit=50': page([skyr, siggis, mine]),
    });
    renderApp('/aliments?q=skyr');
    await screen.findByText('Skyr nature');
    await new Promise((resolve) => setTimeout(resolve, 1200));
    expect(fetchMock.mock.calls.some(([u]) => String(u).includes('/off/search'))).toBe(false);
  });

  it('grise le bouton avec un compte à rebours quand la limite est atteinte (429)', async () => {
    const fetchMock = mockApi({
      'GET /auth/me': { body: alice },
      'GET /foods?q=skyr&limit=50': page([skyr, siggis, mine]),
    });
    fetchMock.mockImplementation(async (url) => {
      const u = String(url);
      if (u.includes('/auth/me')) return Response.json(alice);
      if (u.includes('/off/search')) {
        return Response.json(
          { error: { message: 'Open Food Facts est très demandé' } },
          { status: 429, headers: { 'Retry-After': '42' } },
        );
      }
      return Response.json(page([skyr, siggis, mine]).body);
    });
    renderApp('/aliments?q=skyr');
    await screen.findByText('Skyr nature');
    await userEvent.click(screen.getByRole('button', { name: /Chercher aussi/ }));
    const grise = await screen.findByRole('button', { name: /réessaie dans 4\d s/ });
    expect(grise).toBeDisabled();
  });

  it('explique la panne d’Open Food Facts (502)', async () => {
    mockApi({
      'GET /auth/me': { body: alice },
      'GET /foods?q=skyr&limit=50': page([skyr]),
      'GET /foods/off/search?q=skyr': apiError(
        502,
        'Open Food Facts ne répond pas, réessaie plus tard',
      ),
    });
    renderApp('/aliments?q=skyr');
    await screen.findByText('Skyr nature');
    await userEvent.click(screen.getByRole('button', { name: /Open Food Facts/ }));
    expect(await screen.findByText(/Open Food Facts ne répond pas/)).toBeInTheDocument();
  });
});

describe('Aliments, scan du code-barres', () => {
  beforeEach(() => setDesktop(true));

  async function openScan(handlers) {
    mockApi({ 'GET /auth/me': { body: alice }, ...handlers });
    renderApp('/aliments');
    // Deux boutons existent (PC et téléphone, un seul visible grâce au CSS) : on prend le premier
    await screen.findByText('Cherche un aliment');
    await userEvent.click(screen.getAllByRole('button', { name: 'Scanner un code-barres' })[0]);
    return screen.findByRole('dialog');
  }

  it('retrouve un produit par son numéro tapé à la main puis ouvre sa fiche', async () => {
    const dialog = await openScan({
      'GET /foods/barcode/5060334870123': { body: siggis },
      'GET /foods/2': { body: siggis },
    });
    await userEvent.type(within(dialog).getByLabelText('Code-barres'), '5 060 334 870 123');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Chercher' }));
    expect(await within(dialog).findByText(/Skyr nature 0 %/)).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Utiliser cet aliment' }));
    expect(await screen.findByText(/pour une portion/i)).toBeInTheDocument();
  });

  it('refuse un numéro trop court sans appeler l’API', async () => {
    const dialog = await openScan({});
    await userEvent.type(within(dialog).getByLabelText('Code-barres'), '123');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Chercher' }));
    expect(await within(dialog).findByText(/8 à 14 chiffres/)).toBeInTheDocument();
  });

  it.each([
    [404, 'Produit introuvable', /pas chez Open Food Facts/],
    [429, 'Trop de requêtes', /Trop de produits cherchés/],
    [502, 'Open Food Facts ne répond pas, réessaie plus tard', /Open Food Facts ne répond pas/],
  ])('gère l’erreur %s', async (status, message, expected) => {
    const dialog = await openScan({
      'GET /foods/barcode/5060334870123': apiError(status, message),
    });
    await userEvent.type(within(dialog).getByLabelText('Code-barres'), '5060334870123');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Chercher' }));
    expect(await within(dialog).findByText(expected)).toBeInTheDocument();
  });
});

describe('Fiche d’un aliment', () => {
  beforeEach(() => setDesktop(false));

  it('calcule une portion et affiche la valeur d’origine d’un aliment corrigé', async () => {
    const corrected = {
      ...skyr,
      isCorrected: true,
      original: { name: 'Skyr nature', energyKcal: 65, proteinsG: 10.4 },
    };
    mockApi({ 'GET /auth/me': { body: alice }, 'GET /foods/1': { body: corrected } });
    const { container } = renderApp('/aliments/1');
    const input = await screen.findByLabelText('Poids de la portion, en grammes');
    await userEvent.clear(input);
    await userEvent.type(input, '150');
    expect(screen.getByText('95 kcal')).toBeInTheDocument();
    expect(
      screen.getByText(/Valeur d’origine Ciqual : 65 kcal, 10,4 g de protéines/),
    ).toBeInTheDocument();
    await expectNoA11yViolations(container);
  });

  it('montre « Corriger » seulement à un admin, sur un aliment commun', async () => {
    mockApi({ 'GET /auth/me': { body: alice }, 'GET /foods/1': { body: skyr } });
    const { unmount } = renderApp('/aliments/1');
    await screen.findByText(/pour une portion/i);
    expect(screen.queryByRole('button', { name: 'Corriger' })).not.toBeInTheDocument();
    unmount();

    mockApi({ 'GET /auth/me': { body: admin }, 'GET /foods/1': { body: skyr } });
    renderApp('/aliments/1');
    expect(await screen.findByRole('button', { name: 'Corriger' })).toBeInTheDocument();
  });

  it('envoie seulement les valeurs changées pour une correction', async () => {
    const fetchMock = mockApi({
      'GET /auth/me': { body: admin },
      'GET /foods/1': { body: skyr },
      'PUT /admin/foods/1/correction': { body: { ...skyr, energyKcal: 65 } },
    });
    renderApp('/aliments/1');
    await userEvent.click(await screen.findByRole('button', { name: 'Corriger' }));
    const dialog = await screen.findByRole('dialog');
    const kcal = within(dialog).getByLabelText('Calories (kcal)');
    await userEvent.clear(kcal);
    await userEvent.type(kcal, '65');
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Enregistrer la correction' }),
    );
    await waitFor(() =>
      expect(sentBody(fetchMock, 'PUT /admin/foods/1/correction')).toEqual({ energyKcal: 65 }),
    );
    expect(await screen.findByText('Correction enregistrée.')).toBeInTheDocument();
  });

  it('propose « Modifier » pour mon aliment', async () => {
    mockApi({ 'GET /auth/me': { body: alice }, 'GET /foods/4': { body: mine } });
    renderApp('/aliments/4');
    expect(await screen.findByRole('link', { name: 'Modifier' })).toHaveAttribute(
      'href',
      '/aliments/4/modifier',
    );
  });

  it('dit quand l’aliment n’existe pas', async () => {
    mockApi({ 'GET /auth/me': { body: alice }, 'GET /foods/99': apiError(404, 'x') });
    renderApp('/aliments/99');
    expect(await screen.findByText(/n'existe pas/)).toBeInTheDocument();
  });
});

describe('Aliment perso (formulaire)', () => {
  beforeEach(() => setDesktop(false));

  it('vérifie les saisies avant l’envoi, avec le message de la maquette', async () => {
    const fetchMock = mockApi({ 'GET /auth/me': { body: alice } });
    const { container } = renderApp('/aliments/nouveau');
    await userEvent.type(await screen.findByLabelText('Nom'), 'Skyr maison');
    await userEvent.type(screen.getByLabelText('Calories (kcal)'), '57');
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer l’aliment' }));
    expect((await screen.findAllByText('Indique un nombre, même 0')).length).toBe(3);
    expect(fetchMock.mock.calls.some(([, o]) => o?.method === 'POST')).toBe(false);
    await expectNoA11yViolations(container);
  });

  it('crée l’aliment (virgule acceptée) et ouvre sa fiche', async () => {
    const fetchMock = mockApi({
      'GET /auth/me': { body: alice },
      'POST /foods': { status: 201, body: { ...mine, id: 7 } },
      'GET /foods/7': { body: { ...mine, id: 7 } },
    });
    renderApp('/aliments/nouveau');
    await userEvent.type(await screen.findByLabelText('Nom'), 'Skyr maison');
    await userEvent.type(screen.getByLabelText('Calories (kcal)'), '57');
    await userEvent.type(screen.getByLabelText('Protéines (g)'), '10,5');
    await userEvent.type(screen.getByLabelText('Glucides (g)'), '4');
    await userEvent.type(screen.getByLabelText('Lipides (g)'), '0');
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer l’aliment' }));
    expect(await screen.findByText('Aliment enregistré.')).toBeInTheDocument();
    expect(sentBody(fetchMock, 'POST /foods')).toEqual({
      name: 'Skyr maison',
      brand: null,
      energyKcal: 57,
      proteinsG: 10.5,
      carbsG: 4,
      fatsG: 0,
      barcode: null,
    });
  });

  it('reprend le code-barres d’un scan sans résultat et l’envoie', async () => {
    const fetchMock = mockApi({
      'GET /auth/me': { body: alice },
      'POST /foods': { status: 201, body: { ...mine, id: 7 } },
      'GET /foods/7': { body: { ...mine, id: 7 } },
    });
    renderApp('/aliments/nouveau?code=3017620422003');
    expect(await screen.findByLabelText('Code-barres (facultatif)')).toHaveValue('3017620422003');
    await userEvent.type(screen.getByLabelText('Nom'), 'Pâte à tartiner');
    for (const label of ['Calories (kcal)', 'Protéines (g)', 'Glucides (g)', 'Lipides (g)']) {
      await userEvent.type(screen.getByLabelText(label), '1');
    }
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer l’aliment' }));
    expect(await screen.findByText('Aliment enregistré.')).toBeInTheDocument();
    expect(sentBody(fetchMock, 'POST /foods').barcode).toBe('3017620422003');
  });

  it('refuse un code-barres qui n’a pas 8 à 14 chiffres', async () => {
    mockApi({ 'GET /auth/me': { body: alice } });
    renderApp('/aliments/nouveau');
    await userEvent.type(await screen.findByLabelText('Code-barres (facultatif)'), '123');
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer l’aliment' }));
    expect(
      await screen.findByText('Le code-barres doit contenir 8 à 14 chiffres'),
    ).toBeInTheDocument();
  });

  it('affiche sous le champ l’erreur renvoyée par l’API', async () => {
    mockApi({
      'GET /auth/me': { body: alice },
      'POST /foods': apiError(400, 'Données invalides', [
        { path: ['name'], message: 'Le nom est obligatoire' },
      ]),
    });
    renderApp('/aliments/nouveau');
    await userEvent.type(await screen.findByLabelText('Nom'), ' a');
    for (const label of ['Calories (kcal)', 'Protéines (g)', 'Glucides (g)', 'Lipides (g)']) {
      await userEvent.type(screen.getByLabelText(label), '1');
    }
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer l’aliment' }));
    expect(await screen.findByText('Le nom est obligatoire')).toBeInTheDocument();
  });

  it('supprime un aliment utilisé : explique qu’il est rangé (archivé)', async () => {
    mockApi({
      'GET /auth/me': { body: alice },
      'GET /foods/4': { body: mine },
      'DELETE /foods/4': { body: { result: 'archived' } },
      'GET /foods/mine?limit=50': page([]),
    });
    renderApp('/aliments/4/modifier');
    await userEvent.click(await screen.findByRole('button', { name: 'Supprimer cet aliment' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/il sera rangé/)).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Supprimer cet aliment' }));
    expect(await screen.findByText(/il est rangé/)).toBeInTheDocument();
  });

  it('refuse de modifier l’aliment d’un autre', async () => {
    mockApi({ 'GET /auth/me': { body: alice }, 'GET /foods/1': { body: skyr } });
    renderApp('/aliments/1/modifier');
    expect(await screen.findByText(/que tes propres aliments/)).toBeInTheDocument();
  });
});
