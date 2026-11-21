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
  kind: 'recipe',
  title,
  servings: 2,
  prepTimeMinutes: 15,
  cookTimeMinutes: 20,
  photoUrl: null,
  visibility: 'private',
  owner: alice,
  isMine: true,
  tags: [],
  nutrition: nutrition(270, 17),
  ...extra,
});
const food = {
  id: 1,
  source: 'ciqual',
  name: 'Œuf entier, cru',
  brand: null,
  energyKcal: 140,
  proteinsG: 12,
  carbsG: 1,
  fatsG: 10,
};
const detail = (extra = {}) => ({
  ...short(12, 'Shakshuka'),
  description: 'Des œufs pochés.',
  instructions: 'Faire revenir.\nAjouter les tomates.',
  sourceUrl: null,
  copiedFrom: null,
  sharedWith: [],
  caloriesPerServingManual: null,
  proteinsPerServingManual: null,
  tags: [{ id: 1, name: 'Végé' }],
  ingredients: [
    { id: 1, position: 0, label: '4 œufs', grams: 200, isNegligible: false, food },
    { id: 2, position: 1, label: '1 poivron', grams: null, isNegligible: false, food: null },
  ],
  nutrition: {
    ...nutrition(270, 17),
    total: { calories: 540, proteins: 34, carbs: 30, fats: 32 },
    perServing: { calories: 270, proteins: 17, carbs: 15, fats: 16 },
  },
  ...extra,
});
const tags = [
  { id: 1, name: 'Végé', position: 0 },
  { id: 2, name: 'Rapide', position: 1 },
];
const page = (items) => ({ body: { items, total: items.length, page: 1, limit: 50 } });
const base = { 'GET /auth/me': { body: alice }, 'GET /tags': { body: tags } };

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
])('Recettes, liste (%s)', (_name, desktop) => {
  beforeEach(() => setDesktop(desktop));

  it('affiche les étiquettes avec calories, protéines, durée et auteur, et est accessible', async () => {
    mockApi({
      ...base,
      'GET /recipes?kind=recipe&scope=all&limit=50': page([
        short(1, 'Shakshuka'),
        short(2, 'Pad thaï', { isMine: false, owner: lea, nutrition: nutrition(null, null) }),
      ]),
    });
    const { container } = renderApp('/recettes');
    expect(await screen.findByRole('heading', { name: 'Shakshuka' })).toBeInTheDocument();
    expect(screen.getByText('35 min, 2 parts')).toBeInTheDocument();
    expect(screen.getByText('35 min, 2 parts, de Léa Durand')).toBeInTheDocument();
    expect(screen.getByText('kcal ?')).toBeInTheDocument();
    expect(screen.getByText('2 recettes')).toBeInTheDocument();
    await expectNoA11yViolations(container);
  });

  it('cherche sans accents et filtre par étiquette (dans l’adresse)', async () => {
    const fetchMock = mockApi({
      ...base,
      'GET /recipes?kind=recipe&scope=all&limit=50': page([short(1, 'Shakshuka')]),
      'GET /recipes?kind=recipe&scope=all&tagIds=1&limit=50': page([short(1, 'Shakshuka')]),
      'GET /recipes?kind=recipe&scope=all&q=epinards&tagIds=1&limit=50': page([]),
    });
    renderApp('/recettes');
    await screen.findByRole('heading', { name: 'Shakshuka' });
    await userEvent.click(await screen.findByRole('button', { name: 'Végé' }));
    await waitFor(() =>
      expect(fetchMock.mock.calls.some(([u]) => String(u).includes('tagIds=1'))).toBe(true),
    );
    await userEvent.type(screen.getByLabelText('Chercher une recette'), 'epinards');
    expect(await screen.findByText('Aucune recette')).toBeInTheDocument();
  });

  it('invite à créer la première recette quand il n’y en a aucune', async () => {
    mockApi({ ...base, 'GET /recipes?kind=recipe&scope=all&limit=50': page([]) });
    renderApp('/recettes');
    expect(await screen.findByText('Créer une recette')).toBeInTheDocument();
  });

  it('dit une phrase claire si le chargement échoue, avec « Réessayer »', async () => {
    mockApi({ ...base, 'GET /recipes?kind=recipe&scope=all&limit=50': apiError(500, 'x') });
    renderApp('/recettes');
    expect(await screen.findByRole('alert')).toHaveTextContent('Une erreur est survenue');
    expect(screen.getByRole('button', { name: 'Réessayer' })).toBeInTheDocument();
  });
});

describe('Recettes, fiche', () => {
  beforeEach(() => setDesktop(false));

  it('affiche la recette, les parts font suivre les quantités, et propose modifier et partager', async () => {
    mockApi({ ...base, 'GET /recipes/12': { body: detail() } });
    const { container } = renderApp('/recettes/12');
    expect(await screen.findByRole('heading', { name: 'Shakshuka' })).toBeInTheDocument();
    expect(screen.getByText('200 g')).toBeInTheDocument();
    expect(screen.getByText('? g')).toBeInTheDocument();
    expect(screen.getByText('270 kcal')).toBeInTheDocument();
    expect(screen.getByText('Faire revenir.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Modifier' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Partager' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Une part de plus' }));
    expect(screen.getByText('300 g')).toBeInTheDocument();
    expect(screen.getByText('6 œufs')).toBeInTheDocument();
    await expectNoA11yViolations(container);
  });

  it('dit « à compléter » quand les calories manquent', async () => {
    mockApi({
      ...base,
      'GET /recipes/12': {
        body: detail({
          nutrition: {
            ...nutrition(null, null),
            perServing: { calories: 0, proteins: 0, carbs: 0, fats: 0 },
          },
        }),
      },
    });
    renderApp('/recettes/12');
    expect(await screen.findByText('? kcal')).toBeInTheDocument();
    expect(screen.getByText(/1 ingrédient n’est pas relié/)).toBeInTheDocument();
  });

  it('recette d’une autre personne : « Copier chez moi » à la place de modifier', async () => {
    const fetchMock = mockApi({
      ...base,
      'GET /recipes/12': { body: detail({ isMine: false, owner: lea }) },
      'POST /recipes/12/copy': { status: 201, body: detail({ id: 20 }) },
      'GET /recipes/20': { body: detail({ id: 20 }) },
    });
    renderApp('/recettes/12');
    await screen.findByRole('heading', { name: 'Shakshuka' });
    expect(screen.queryByRole('link', { name: 'Modifier' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Supprimer/ })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Copier chez moi' }));
    expect(await screen.findByText(/Recette copiée chez toi/)).toBeInTheDocument();
    expect(
      fetchMock.mock.calls.some(([u, o]) => o?.method === 'POST' && String(u).endsWith('/copy')),
    ).toBe(true);
  });

  it('supprime après confirmation', async () => {
    const fetchMock = mockApi({
      ...base,
      'GET /recipes/12': { body: detail() },
      'DELETE /recipes/12': { status: 204 },
      'GET /recipes?kind=recipe&scope=all&limit=50': page([]),
    });
    renderApp('/recettes/12');
    await userEvent.click(await screen.findByRole('button', { name: 'Supprimer la recette' }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: /Supprimer « Shakshuka »/ }));
    expect(await screen.findByText(/« Shakshuka » est supprimée/)).toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([, o]) => o?.method === 'DELETE')).toBe(true);
  });

  it('partage avec une personne choisie par son nom', async () => {
    const fetchMock = mockApi({
      ...base,
      'GET /recipes/12': { body: detail() },
      'GET /users/search?q=le': { body: [lea] },
      'PUT /recipes/12': { body: detail({ visibility: 'shared' }) },
    });
    renderApp('/recettes/12');
    await userEvent.click(await screen.findByRole('button', { name: 'Partager' }));
    await userEvent.click(screen.getByLabelText(/Des personnes choisies/));
    await userEvent.type(screen.getByLabelText('Chercher une personne par son nom'), 'le');
    await userEvent.click(await screen.findByRole('button', { name: 'Ajouter Léa Durand' }));
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer le partage' }));
    await waitFor(() => expect(sentBody(fetchMock, 'PUT /recipes/12')).toBeDefined());
    const body = sentBody(fetchMock, 'PUT /recipes/12');
    expect(body.visibility).toBe('shared');
    expect(body.sharedWith).toEqual([5]);
    expect(body.title).toBe('Shakshuka');
    expect(body.ingredients[0]).toMatchObject({ foodId: 1, grams: 200 });
  });
});

describe('Recettes, création', () => {
  beforeEach(() => setDesktop(false));

  it('vérifie le titre avant l’envoi et explique quoi faire sous le champ', async () => {
    const fetchMock = mockApi(base);
    const { container } = renderApp('/recettes/nouveau');
    await userEvent.click(
      (await screen.findAllByRole('button', { name: 'Enregistrer la recette' })).at(-1),
    );
    expect(await screen.findByText('Le titre est obligatoire')).toBeInTheDocument();
    expect(screen.getByText('Écris l’ingrédient ou choisis un aliment')).toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([, o]) => o?.method === 'POST')).toBe(false);
    await expectNoA11yViolations(container);
  });

  it('relie un ingrédient écrit à la main à un aliment, sans envoyer la recette', async () => {
    const fetchMock = mockApi({
      ...base,
      'GET /recipes/12': { body: detail() },
      'GET /foods?q=oeuf&limit=50': { body: { items: [food], total: 1 } },
    });
    renderApp('/recettes/12/modifier');
    expect(await screen.findByLabelText('Ingrédient 2')).toHaveValue('1 poivron');
    await userEvent.click(screen.getByRole('button', { name: 'Relier' }));
    const fenetre = await screen.findByRole('dialog', { name: 'Relier à un aliment' });
    await userEvent.type(within(fenetre).getByLabelText('Chercher un aliment'), 'oeuf');
    await userEvent.click(await within(fenetre).findByRole('button', { name: /Œuf entier/ }));
    // Poids impossible à calculer ici (pas de mesures dans l'aliment imité) : la case est vide, on la remplit
    await userEvent.type(within(fenetre).getByLabelText('Poids (g)'), '120');
    await userEvent.click(within(fenetre).getByRole('button', { name: 'Relier' }));
    await waitFor(() => expect(screen.getAllByText(/Relié à « Œuf entier, cru »/)).toHaveLength(2));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([, o]) => o?.method === 'PUT')).toBe(false);
  });

  it('enregistre une recette et ouvre sa fiche', async () => {
    const fetchMock = mockApi({
      ...base,
      'POST /recipes': { status: 201, body: detail() },
      'GET /recipes/12': { body: detail() },
    });
    renderApp('/recettes/nouveau');
    await userEvent.type(await screen.findByLabelText('Titre'), 'Shakshuka');
    await userEvent.type(screen.getByLabelText('Ingrédient 1'), '2 carottes');
    await userEvent.type(screen.getByLabelText('Grammes de l’ingrédient 1'), '200');
    await userEvent.click(screen.getByRole('button', { name: 'Végé' }));
    await userEvent.click(screen.getAllByRole('button', { name: 'Enregistrer la recette' }).at(-1));
    expect(await screen.findByText('Recette enregistrée.')).toBeInTheDocument();
    const body = sentBody(fetchMock, 'POST /recipes');
    expect(body).toMatchObject({
      kind: 'recipe',
      title: 'Shakshuka',
      servings: 1,
      visibility: 'private',
      tagIds: [1],
      sharedWith: [],
    });
    expect(body.ingredients).toEqual([
      { label: '2 carottes', foodId: null, grams: 200, isNegligible: false },
    ]);
  });

  it('montre sous le bon champ une erreur renvoyée par l’API', async () => {
    mockApi({
      ...base,
      'POST /recipes': apiError(400, 'Données invalides', [
        { path: ['ingredients', 0, 'grams'], message: 'Les grammes sont trop élevés' },
      ]),
    });
    renderApp('/recettes/nouveau');
    await userEvent.type(await screen.findByLabelText('Titre'), 'Soupe');
    await userEvent.type(screen.getByLabelText('Ingrédient 1'), 'eau');
    await userEvent.type(screen.getByLabelText('Grammes de l’ingrédient 1'), '5');
    await userEvent.click(screen.getAllByRole('button', { name: 'Enregistrer la recette' }).at(-1));
    expect(await screen.findByText('Les grammes sont trop élevés')).toBeInTheDocument();
  });

  it('ouvre le formulaire rempli avec un brouillon d’import, et envoie l’adresse de la photo', async () => {
    const draft = {
      title: 'Shakshuka facile',
      description: null,
      instructions: 'a\nb',
      servings: 2,
      prepTimeMinutes: 15,
      cookTimeMinutes: 20,
      sourceUrl: 'https://site.fr/r',
      imageUrl: 'https://site.fr/photo.jpg',
      ingredients: [{ label: '4 œufs' }],
    };
    const fetchMock = mockApi({
      ...base,
      'POST /recipes/import': { body: draft },
      'POST /recipes': { status: 201, body: detail() },
      'GET /recipes/12': { body: detail() },
    });
    renderApp('/recettes/importer');
    await userEvent.type(await screen.findByLabelText('Lien de la recette'), 'https://site.fr/r');
    await userEvent.click(screen.getByRole('button', { name: 'Lire la recette' }));
    expect(await screen.findByText('Recette trouvée')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Vérifier et enregistrer' }));
    expect(await screen.findByLabelText('Titre')).toHaveValue('Shakshuka facile');
    expect(screen.getByLabelText('Ingrédient 1')).toHaveValue('4 œufs');
    await userEvent.click(screen.getAllByRole('button', { name: 'Enregistrer la recette' }).at(-1));
    await screen.findByText('Recette enregistrée.');
    const body = sentBody(fetchMock, 'POST /recipes');
    expect(body.photoUrl).toBe('https://site.fr/photo.jpg');
    expect(body.sourceUrl).toBe('https://site.fr/r');
  });

  it('page sans fiche lisible (TikTok) : propose de créer à la main en gardant le lien', async () => {
    mockApi({
      ...base,
      'POST /recipes/import': apiError(
        422,
        'Aucune recette trouvée sur cette page : ajoute-la à la main (le lien sera gardé)',
      ),
    });
    renderApp('/recettes/importer');
    await userEvent.type(
      await screen.findByLabelText('Lien de la recette'),
      'https://www.tiktok.com/@x/video/1',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Lire la recette' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Aucune recette trouvée');
    await userEvent.click(screen.getByRole('button', { name: /Créer la recette à la main/ }));
    expect(await screen.findByLabelText('Lien d’origine (facultatif)')).toHaveValue(
      'https://www.tiktok.com/@x/video/1',
    );
  });
});

describe('Recettes, clic sur PC', () => {
  beforeEach(() => setDesktop(true));

  it('ouvre directement la fiche complète, sans panneau', async () => {
    mockApi({
      ...base,
      'GET /recipes?kind=recipe&scope=all&limit=50': page([short(12, 'Shakshuka')]),
      'GET /recipes/12': { body: detail() },
    });
    renderApp('/recettes');
    await userEvent.click(await screen.findByRole('link', { name: /Shakshuka/ }));
    expect(await screen.findByText('Des œufs pochés.')).toBeInTheDocument();
    expect(screen.getByText('Ajouter les tomates.')).toBeInTheDocument();
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
  });
});

describe('Recettes, étapes du formulaire', () => {
  beforeEach(() => setDesktop(false));

  const ouvrir = async () => {
    const fetchMock = mockApi({
      ...base,
      'GET /recipes/12': { body: detail() },
      'PUT /recipes/12': { body: detail() },
    });
    renderApp('/recettes/12/modifier');
    await screen.findByLabelText('Étape 1');
    return fetchMock;
  };

  it('découpe le texte de l’API : une étape par champ', async () => {
    await ouvrir();
    expect(screen.getByLabelText('Étape 1')).toHaveValue('Faire revenir.');
    expect(screen.getByLabelText('Étape 2')).toHaveValue('Ajouter les tomates.');
    expect(screen.queryByLabelText('Étape 3')).not.toBeInTheDocument();
  });

  it('ajoute et retire une étape, envoie les étapes recollées sans l’étape vide', async () => {
    const fetchMock = await ouvrir();
    await userEvent.click(screen.getByRole('button', { name: 'Ajouter une étape' }));
    await userEvent.click(screen.getByRole('button', { name: 'Ajouter une étape' }));
    await userEvent.type(screen.getByLabelText('Étape 3'), 'Servir chaud.');
    // l'étape 4 reste vide ; on retire la première
    await userEvent.click(screen.getByRole('button', { name: 'Retirer l’étape 1' }));
    expect(screen.getByLabelText('Étape 1')).toHaveValue('Ajouter les tomates.');
    await userEvent.click(screen.getAllByRole('button', { name: 'Enregistrer la recette' }).at(-1));
    await waitFor(() => expect(sentBody(fetchMock, 'PUT /recipes/12')).toBeTruthy());
    expect(sentBody(fetchMock, 'PUT /recipes/12').instructions).toBe(
      'Ajouter les tomates.\nServir chaud.',
    );
  });

  it('remplace les retours à la ligne d’une étape par une espace', async () => {
    const fetchMock = await ouvrir();
    await userEvent.type(screen.getByLabelText('Étape 2'), '{Enter}Saler.');
    expect(screen.getByLabelText('Étape 2')).toHaveValue('Ajouter les tomates. Saler.');
    await userEvent.click(screen.getAllByRole('button', { name: 'Enregistrer la recette' }).at(-1));
    await waitFor(() => expect(sentBody(fetchMock, 'PUT /recipes/12')).toBeTruthy());
    expect(sentBody(fetchMock, 'PUT /recipes/12').instructions).toBe(
      'Faire revenir.\nAjouter les tomates. Saler.',
    );
  });

  it('montre sous les étapes l’erreur renvoyée par l’API', async () => {
    mockApi({
      ...base,
      'GET /recipes/12': { body: detail() },
      'PUT /recipes/12': apiError(400, 'Données invalides', [
        { path: ['instructions'], message: 'Les étapes sont trop longues' },
      ]),
    });
    renderApp('/recettes/12/modifier');
    await screen.findByLabelText('Étape 1');
    await userEvent.click(screen.getAllByRole('button', { name: 'Enregistrer la recette' }).at(-1));
    expect(await screen.findByText('Les étapes sont trop longues')).toBeInTheDocument();
  });

  it('place les infos, puis les ingrédients, puis les étapes (ordre du téléphone)', async () => {
    await ouvrir();
    const position = (node) => node.compareDocumentPosition.bind(node);
    const titre = screen.getByLabelText('Titre');
    const ingredient = screen.getByLabelText('Ingrédient 1');
    const etape = screen.getByLabelText('Étape 1');
    expect(position(titre)(ingredient) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(position(ingredient)(etape) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});

describe('Recettes, relier une ligne avec ses quantités', () => {
  beforeEach(() => setDesktop(false));

  const aliment = (id, name, measures) => ({ ...food, id, name, measures });
  const lait = aliment(2, 'Lait demi-écrémé', {
    gramsPerMl: 1.031,
    gramsPerMlSource: 'reference',
    pieceGrams: null,
    source: 'USDA FoodData Central',
  });
  const oeuf = aliment(1, 'Œuf entier, cru', {
    gramsPerMl: 1,
    gramsPerMlSource: 'water',
    pieceGrams: 50,
    pieceLabel: '1 œuf (gros)',
    source: 'USDA FoodData Central',
  });
  const thon = aliment(3, 'Thon au naturel', {
    gramsPerMl: 1,
    gramsPerMlSource: 'water',
    pieceGrams: null,
    source: null,
  });
  const draft = {
    title: 'Test',
    description: null,
    instructions: 'a',
    servings: 2,
    prepTimeMinutes: null,
    cookTimeMinutes: null,
    sourceUrl: null,
    imageUrl: null,
    ingredients: [{ label: '20 cl de lait' }, { label: '2 œufs' }, { label: '1 boîte de thon' }],
  };

  async function ouvrir() {
    const fetchMock = mockApi({
      ...base,
      'POST /recipes/import': { body: draft },
      'POST /recipes': { status: 201, body: detail() },
      'GET /recipes/12': { body: detail() },
      'GET /foods?q=lait&limit=50': { body: { items: [lait], total: 1 } },
      'GET /foods?q=oeuf&limit=50': { body: { items: [oeuf], total: 1 } },
      'GET /foods?q=thon&limit=50': { body: { items: [thon], total: 1 } },
    });
    renderApp('/recettes/importer');
    await userEvent.type(await screen.findByLabelText('Lien de la recette'), 'https://site.fr/r');
    await userEvent.click(screen.getByRole('button', { name: 'Lire la recette' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Vérifier et enregistrer' }));
    await screen.findByLabelText('Ingrédient 3');
    return fetchMock;
  }

  async function relier(recherche, nom) {
    await userEvent.click(screen.getAllByRole('button', { name: 'Relier' })[0]);
    const fenetre = await screen.findByRole('dialog', { name: 'Relier à un aliment' });
    await userEvent.type(within(fenetre).getByLabelText('Chercher un aliment'), recherche);
    await userEvent.click(await within(fenetre).findByRole('button', { name: nom }));
    return fenetre;
  }

  it('« 20 cl de lait » donne 206 g sans rien saisir', async () => {
    const fetchMock = await ouvrir();
    const fenetre = await relier('lait', /Lait demi/);
    expect(within(fenetre).getByLabelText('Poids (g)')).toHaveValue('206');
    expect(within(fenetre).getByText('20 cl → 206 g')).toBeInTheDocument();
    await userEvent.click(within(fenetre).getByRole('button', { name: 'Relier' }));
    expect(screen.getByLabelText('Grammes de l’ingrédient 1')).toHaveValue('206');
    expect(
      fetchMock.mock.calls.some(([url, o]) => o?.method === 'POST' && url.endsWith('/recipes')),
    ).toBe(false);
  });

  it('« 2 œufs » donne 100 g sans saisie', async () => {
    await ouvrir();
    await userEvent.click(screen.getAllByRole('button', { name: 'Relier' })[1]);
    const fenetre = await screen.findByRole('dialog', { name: 'Relier à un aliment' });
    await userEvent.type(within(fenetre).getByLabelText('Chercher un aliment'), 'oeuf');
    await userEvent.click(await within(fenetre).findByRole('button', { name: /Œuf entier/ }));
    expect(within(fenetre).getByLabelText('Poids (g)')).toHaveValue('100');
    expect(within(fenetre).getByText('2 × 1 œuf (gros) = 100 g')).toBeInTheDocument();
    await userEvent.click(within(fenetre).getByRole('button', { name: 'Relier' }));
    expect(screen.getByLabelText('Grammes de l’ingrédient 2')).toHaveValue('100');
    expect(screen.queryByText(/poids estimé/)).not.toBeInTheDocument();
  });

  it('« 1 boîte de thon » demande les grammes', async () => {
    await ouvrir();
    await userEvent.click(screen.getAllByRole('button', { name: 'Relier' })[2]);
    const fenetre = await screen.findByRole('dialog', { name: 'Relier à un aliment' });
    await userEvent.type(within(fenetre).getByLabelText('Chercher un aliment'), 'thon');
    await userEvent.click(await within(fenetre).findByRole('button', { name: /Thon/ }));
    expect(within(fenetre).queryByText(/→/)).not.toBeInTheDocument();
    expect(within(fenetre).getByLabelText('Poids (g)')).toHaveValue('');
    expect(within(fenetre).getByRole('status')).toHaveTextContent(/indique le poids réel/);
    // Sans poids, « Relier » refuse et le redemande
    await userEvent.click(within(fenetre).getByRole('button', { name: 'Relier' }));
    expect(
      within(fenetre).getByText('Indique un poids en grammes, par exemple 150'),
    ).toBeInTheDocument();
    await userEvent.type(within(fenetre).getByLabelText('Poids (g)'), '140');
    await userEvent.click(within(fenetre).getByRole('button', { name: 'Relier' }));
    expect(screen.getByLabelText('Grammes de l’ingrédient 3')).toHaveValue('140');
  });

  it('un volume dont la densité est inconnue n’est pas pré-rempli : le poids réel est demandé', async () => {
    await ouvrir();
    await userEvent.clear(screen.getByLabelText('Ingrédient 1'));
    await userEvent.type(screen.getByLabelText('Ingrédient 1'), '20 cl de truc');
    await userEvent.click(screen.getAllByRole('button', { name: 'Relier' })[0]);
    const fenetre = await screen.findByRole('dialog', { name: 'Relier à un aliment' });
    await userEvent.type(within(fenetre).getByLabelText('Chercher un aliment'), 'oeuf');
    await userEvent.click(await within(fenetre).findByRole('button', { name: /Œuf entier/ }));
    expect(within(fenetre).getByRole('status')).toHaveTextContent(
      /Je ne sais pas combien pèsent 20 cl de cet aliment \(environ 200 g si c’est comme de l’eau\)/,
    );
    expect(within(fenetre).getByLabelText('Poids (g)')).toHaveValue('');
    await userEvent.type(within(fenetre).getByLabelText('Poids (g)'), '250');
    await userEvent.click(within(fenetre).getByRole('button', { name: 'Relier' }));
    expect(screen.getByLabelText('Grammes de l’ingrédient 1')).toHaveValue('250');
  });
});
