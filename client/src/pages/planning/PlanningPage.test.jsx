import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../../test/axe.js';
import { alice, apiError, mockApi, renderApp, sentBody } from '../../test/helpers.jsx';

const lea = { id: 5, firstName: 'Léa', lastName: 'Durand' };
const slots = [
  { id: 1, name: 'Petit-déj', position: 0, isDefault: true, isHidden: false },
  { id: 2, name: 'Midi', position: 1, isDefault: true, isHidden: false },
  { id: 3, name: 'Soir', position: 2, isDefault: true, isHidden: false },
];
const LUNDI = '2026-11-16';
const semaine = (monday) =>
  Array.from({ length: 7 }, (_, i) => {
    const d = new Date(`${monday}T12:00:00`);
    d.setDate(d.getDate() + i);
    return d.toISOString().slice(0, 10);
  });

const entree = (id, date, slotId, label, calories, extra = {}) => ({
  id,
  date,
  slotId,
  position: 0,
  label,
  servings: null,
  caloriesManual: null,
  recipe: { id: 100 + id, kind: 'recipe', title: label, photoUrl: null, isMine: true },
  recipeAvailable: true,
  lastKnownKcalPerServing: calories,
  lastKnownProteinsPerServing: 10,
  calories,
  proteins: calories === null ? null : 10,
  ...extra,
});

// Une semaine : le jeudi 19 est rempli, le lundi a un plat dont la recette a disparu.
function semaineType({ monday = LUNDI, entries } = {}) {
  const toutes = entries ?? [
    entree(1, '2026-11-16', 2, 'Soupe de la voisine', 300, {
      recipe: null,
      recipeAvailable: false,
    }),
    entree(2, '2026-11-19', 1, 'Overnight oats', 380),
    entree(3, '2026-11-19', 2, 'Poulet riz', 520),
    entree(4, '2026-11-19', 3, 'Restau', null, {
      recipe: null,
      recipeAvailable: null,
      caloriesManual: null,
    }),
  ];
  const days = semaine(monday).map((date) => {
    const list = toutes.filter((e) => e.date === date);
    const connues = list.filter((e) => e.calories !== null);
    return {
      date,
      entries: list,
      totalCalories: connues.reduce((s, e) => s + e.calories, 0),
      totalProteins: connues.reduce((s, e) => s + (e.proteins ?? 0), 0),
      unknownCount: list.length - connues.length,
    };
  });
  return {
    weekStart: monday,
    weekEnd: days[6].date,
    owner: alice,
    isMine: true,
    slots,
    days,
    totals: {
      calories: days.reduce((s, d) => s + d.totalCalories, 0),
      proteins: days.reduce((s, d) => s + d.totalProteins, 0),
      unknownCount: days.reduce((s, d) => s + d.unknownCount, 0),
    },
  };
}

const nutrition = (k) => ({ caloriesPerServing: k, proteinsPerServing: k ? 20 : null });
const recette = (id, title, extra = {}) => ({
  id,
  kind: 'recipe',
  title,
  photoUrl: null,
  isMine: true,
  owner: alice,
  nutrition: nutrition(270),
  ...extra,
});
const page = (items) => ({ body: { items, total: items.length, page: 1, limit: 50 } });
const base = { 'GET /auth/me': { body: alice } };
const SEMAINE = `GET /planning?week=${LUNDI}`;

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
])('Planning, semaine (%s)', (_name, desktop) => {
  beforeEach(() => setDesktop(desktop));

  it('affiche le ticket du jour par créneau, son total et le résumé de la semaine', async () => {
    mockApi({ ...base, [SEMAINE]: { body: semaineType() } });
    const { container } = renderApp('/planning?j=2026-11-19');
    expect(await screen.findByText('JEUDI 19 NOVEMBRE')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Planning', level: 1 })).toBeInTheDocument();
    expect(screen.getByText('Semaine du 16 au 22 novembre')).toBeInTheDocument();
    for (const nom of ['Petit-déj', 'Midi', 'Soir']) {
      expect(screen.getByText(nom)).toBeInTheDocument();
    }
    expect(screen.getByRole('button', { name: 'Modifier : Overnight oats' })).toHaveTextContent(
      '380',
    );
    // 380 + 520 : la ligne sans calories n'est pas comptée, et on le dit
    expect(screen.getAllByText('900').length).toBeGreaterThan(0);
    expect(screen.getByText('dont protéines')).toBeInTheDocument();
    expect(screen.getByText(/1 ligne sans calories connues, non comptée/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Modifier : Restau' })).toHaveTextContent('?');
    // 300 (lundi, recette retirée) + 900 (jeudi) = 1 200 kcal sur 2 jours
    expect(
      screen.getByText(/1.200 kcal prévues sur 2 jours, soit 600 en moyenne/),
    ).toBeInTheDocument();
    await expectNoA11yViolations(container);
  });

  it('dit qu’une recette retirée garde ses dernières calories connues, comptées dans le total', async () => {
    mockApi({ ...base, [SEMAINE]: { body: semaineType() } });
    renderApp('/planning?j=2026-11-16');
    const ligne = await screen.findByRole('button', { name: 'Modifier : Soupe de la voisine' });
    expect(ligne).toHaveTextContent('300');
    expect(ligne).toHaveTextContent('recette retirée, dernières calories connues');
  });

  it('montre un jour vide avec une phrase qui dit quoi faire', async () => {
    mockApi({ ...base, [SEMAINE]: { body: semaineType() } });
    renderApp('/planning?j=2026-11-21');
    expect(await screen.findByText('Rien de prévu ce jour.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Ajouter une ligne/ })).toBeEnabled();
  });

  it('passe à la semaine suivante et la charge', async () => {
    const fetchMock = mockApi({
      ...base,
      [SEMAINE]: { body: semaineType() },
      'GET /planning?week=2026-11-23': { body: semaineType({ monday: '2026-11-23', entries: [] }) },
    });
    renderApp('/planning?j=2026-11-19');
    await screen.findByText('JEUDI 19 NOVEMBRE');
    await userEvent.click(screen.getByRole('button', { name: 'Semaine suivante' }));
    expect(await screen.findByText('JEUDI 26 NOVEMBRE')).toBeInTheDocument();
    expect(screen.getByText('Semaine du 23 au 29 novembre')).toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([url]) => url === '/api/planning?week=2026-11-23')).toBe(
      true,
    );
  });

  it('change de jour sans recharger la semaine', async () => {
    const fetchMock = mockApi({ ...base, [SEMAINE]: { body: semaineType() } });
    renderApp('/planning?j=2026-11-19');
    await screen.findByText('JEUDI 19 NOVEMBRE');
    const nav = screen.getByRole('navigation', { name: 'Jours de la semaine' });
    await userEvent.click(within(nav).getByRole('button', { name: 'lundi 16 novembre' }));
    expect(await screen.findByText('LUNDI 16 NOVEMBRE')).toBeInTheDocument();
    expect(fetchMock.mock.calls.filter(([url]) => String(url).includes('/planning?'))).toHaveLength(
      1,
    );
  });

  it('dit clairement quand le planning ne se charge pas, et permet de réessayer', async () => {
    let appels = 0;
    mockApi({
      ...base,
      [SEMAINE]: () => (++appels === 1 ? apiError(500, 'boum') : { body: semaineType() }),
    });
    renderApp('/planning?j=2026-11-19');
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.queryByText('boum')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Réessayer' }));
    expect(await screen.findByText('JEUDI 19 NOVEMBRE')).toBeInTheDocument();
  });
});

describe('Planning, disposition PC', () => {
  beforeEach(() => setDesktop(true));

  it('liste les jours à gauche avec leur total, « rien » pour un jour vide', async () => {
    mockApi({ ...base, [SEMAINE]: { body: semaineType() } });
    renderApp('/planning?j=2026-11-19');
    await screen.findByText('JEUDI 19 NOVEMBRE');
    const nav = screen.getByRole('navigation', { name: 'Jours de la semaine' });
    expect(within(nav).getByRole('button', { name: 'jeudi 19 novembre' })).toHaveAttribute(
      'aria-current',
      'date',
    );
    expect(within(nav).getByRole('button', { name: 'jeudi 19 novembre' })).toHaveTextContent('900');
    expect(within(nav).getByRole('button', { name: 'samedi 21 novembre' })).toHaveTextContent(
      'rien',
    );
  });
});

describe('Planning, ajouter un plat', () => {
  beforeEach(() => setDesktop(false));

  const liste = (items) => ({
    ...base,
    [SEMAINE]: { body: semaineType() },
    'GET /recipes?kind=recipe&limit=50': page(items),
  });

  it('ajoute une recette avec ses parts dans le créneau choisi, puis recharge', async () => {
    const fetchMock = mockApi({
      ...liste([recette(12, 'Shakshuka'), recette(13, 'Dal aux épinards')]),
      'POST /planning/entries': { status: 201, body: entree(9, '2026-11-21', 3, 'Shakshuka', 405) },
    });
    renderApp('/planning?j=2026-11-21');
    await userEvent.click(await screen.findByRole('button', { name: /Ajouter une ligne/ }));
    const fenetre = await screen.findByRole('dialog');
    // Tous les créneaux sont vides ce jour-là : le premier est proposé
    expect(
      within(fenetre).getByRole('heading', { name: 'Ajouter au petit-déj' }),
    ).toBeInTheDocument();
    await userEvent.click(within(fenetre).getByRole('button', { name: 'Soir' }));
    await userEvent.click(await within(fenetre).findByRole('radio', { name: /Shakshuka/ }));
    await expectNoA11yViolations(document.body);
    await userEvent.click(within(fenetre).getByRole('button', { name: 'Une part de plus' }));
    expect(within(fenetre).getByText('405 kcal, 30 g de prot.')).toBeInTheDocument();
    await userEvent.click(within(fenetre).getByRole('button', { name: 'Ajouter au soir' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(sentBody(fetchMock, 'POST /planning/entries')).toEqual({
      date: '2026-11-21',
      slotId: 3,
      recipeId: 12,
      servings: 1.5,
    });
    expect(screen.getByText(/Ajouté : « Shakshuka », samedi 21 novembre/)).toBeInTheDocument();
    // La semaine a été relue
    expect(
      fetchMock.mock.calls.filter(([url]) => url === `/api/planning?week=${LUNDI}`).length,
    ).toBe(2);
  });

  it('n’active le bouton qu’une fois un plat choisi, et dit quand la liste est vide', async () => {
    mockApi(liste([]));
    renderApp('/planning?j=2026-11-21');
    await userEvent.click(await screen.findByRole('button', { name: /Ajouter une ligne/ }));
    const fenetre = await screen.findByRole('dialog');
    expect(await within(fenetre).findByText(/Tu n’as pas encore de recette/)).toBeInTheDocument();
    expect(within(fenetre).getByRole('button', { name: /^Ajouter au/ })).toBeDisabled();
  });

  it('propose de copier la recette d’une autre personne, seulement si on accepte', async () => {
    const fetchMock = mockApi({
      ...liste([recette(14, 'Pad thaï', { isMine: false, owner: lea })]),
      'POST /planning/entries': {
        status: 201,
        body: entree(9, '2026-11-21', 1, 'Pad thaï', 500, {
          recipe: { id: 14, kind: 'recipe', title: 'Pad thaï', photoUrl: null, isMine: false },
        }),
      },
      'POST /recipes/14/copy': { status: 201, body: { id: 40 } },
    });
    renderApp('/planning?j=2026-11-21');
    await userEvent.click(await screen.findByRole('button', { name: /Ajouter une ligne/ }));
    const fenetre = await screen.findByRole('dialog');
    await userEvent.click(await within(fenetre).findByRole('radio', { name: /Pad thaï/ }));
    expect(within(fenetre).getByText(/de Léa Durand/)).toBeInTheDocument();
    await userEvent.click(within(fenetre).getByRole('button', { name: /^Ajouter au/ }));
    expect(await screen.findByText(/Copier chez moi pour la garder \?/)).toBeInTheDocument();
    // Rien n'est copié sans accord
    expect(fetchMock.mock.calls.some(([url]) => String(url).endsWith('/copy'))).toBe(false);
    await userEvent.click(screen.getByRole('button', { name: 'Copier chez moi' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByText(/est copiée chez toi/)).toBeInTheDocument();
  });

  it('refuse la proposition de copie sans rien copier', async () => {
    const fetchMock = mockApi({
      ...liste([recette(14, 'Pad thaï', { isMine: false, owner: lea })]),
      'POST /planning/entries': { status: 201, body: entree(9, '2026-11-21', 1, 'Pad thaï', 500) },
    });
    renderApp('/planning?j=2026-11-21');
    await userEvent.click(await screen.findByRole('button', { name: /Ajouter une ligne/ }));
    await userEvent.click(await screen.findByRole('radio', { name: /Pad thaï/ }));
    await userEvent.click(screen.getByRole('button', { name: /^Ajouter au/ }));
    await userEvent.click(await screen.findByRole('button', { name: 'Non merci' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(fetchMock.mock.calls.some(([url]) => String(url).endsWith('/copy'))).toBe(false);
  });

  it('ajoute un texte libre avec ses calories, et vérifie le titre avant d’envoyer', async () => {
    const fetchMock = mockApi({
      ...liste([]),
      'POST /planning/entries': {
        status: 201,
        body: entree(9, '2026-11-21', 2, 'Une pomme', 80, { recipe: null, recipeAvailable: null }),
      },
    });
    renderApp('/planning?j=2026-11-21');
    await userEvent.click(await screen.findByRole('button', { name: /Ajouter une ligne/ }));
    const fenetre = await screen.findByRole('dialog');
    await userEvent.click(within(fenetre).getByRole('button', { name: 'Texte libre' }));
    await userEvent.click(within(fenetre).getByRole('button', { name: 'Midi' }));
    await userEvent.type(within(fenetre).getByLabelText('Calories (facultatif)'), 'abc');
    await userEvent.type(within(fenetre).getByLabelText('Titre'), 'Une pomme');
    await userEvent.click(within(fenetre).getByRole('button', { name: 'Ajouter au midi' }));
    expect(await within(fenetre).findByText('Les calories sont invalides')).toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([url]) => url === '/api/planning/entries')).toBe(false);
    const calories = within(fenetre).getByLabelText('Calories (facultatif)');
    await userEvent.clear(calories);
    await userEvent.type(calories, '80,5');
    await userEvent.click(within(fenetre).getByRole('button', { name: 'Ajouter au midi' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(sentBody(fetchMock, 'POST /planning/entries')).toEqual({
      date: '2026-11-21',
      slotId: 2,
      label: 'Une pomme',
      caloriesManual: 80.5,
    });
  });

  it('un texte libre sans calories n’envoie pas de calories (jamais 0)', async () => {
    const fetchMock = mockApi({
      ...liste([]),
      'POST /planning/entries': {
        status: 201,
        body: entree(9, '2026-11-21', 1, 'Restau', null, { recipe: null, recipeAvailable: null }),
      },
    });
    renderApp('/planning?j=2026-11-21');
    await userEvent.click(await screen.findByRole('button', { name: /Ajouter une ligne/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Texte libre' }));
    await userEvent.type(screen.getByLabelText('Titre'), 'Restau');
    await userEvent.click(screen.getByRole('button', { name: /^Ajouter au/ }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(sentBody(fetchMock, 'POST /planning/entries')).toEqual({
      date: '2026-11-21',
      slotId: 1,
      label: 'Restau',
    });
  });

  it('affiche l’erreur de l’API dans la fenêtre sans la fermer', async () => {
    mockApi({
      ...liste([recette(12, 'Shakshuka')]),
      'POST /planning/entries': apiError(404, 'Recette introuvable'),
    });
    renderApp('/planning?j=2026-11-21');
    await userEvent.click(await screen.findByRole('button', { name: /Ajouter une ligne/ }));
    await userEvent.click(await screen.findByRole('radio', { name: /Shakshuka/ }));
    await userEvent.click(screen.getByRole('button', { name: /^Ajouter au/ }));
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});

describe('Planning, modifier, déplacer, retirer', () => {
  beforeEach(() => setDesktop(false));

  it('change les parts et déplace la ligne vers un autre jour et créneau', async () => {
    const fetchMock = mockApi({
      ...base,
      [SEMAINE]: { body: semaineType() },
      'PATCH /planning/entries/3': { body: entree(3, '2026-11-20', 3, 'Poulet riz', 780) },
    });
    renderApp('/planning?j=2026-11-19');
    await userEvent.click(await screen.findByRole('button', { name: 'Modifier : Poulet riz' }));
    const fenetre = await screen.findByRole('dialog');
    await userEvent.click(within(fenetre).getByRole('button', { name: 'Une part de plus' }));
    await userEvent.click(within(fenetre).getByRole('button', { name: 'Une part de plus' }));
    await userEvent.click(within(fenetre).getByRole('button', { name: 'Soir' }));
    const jour = within(fenetre).getByLabelText('Jour');
    await userEvent.clear(jour);
    await userEvent.type(jour, '2026-11-20');
    await userEvent.click(within(fenetre).getByRole('button', { name: 'Enregistrer' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(sentBody(fetchMock, 'PATCH /planning/entries/3')).toEqual({
      date: '2026-11-20',
      slotId: 3,
      servings: 2,
    });
    expect(screen.getByText('Modifications enregistrées.')).toBeInTheDocument();
  });

  it('modifie le titre et les calories d’un texte libre', async () => {
    const fetchMock = mockApi({
      ...base,
      [SEMAINE]: { body: semaineType() },
      'PATCH /planning/entries/4': { body: entree(4, '2026-11-19', 3, 'Restau', 700) },
    });
    renderApp('/planning?j=2026-11-19');
    await userEvent.click(await screen.findByRole('button', { name: 'Modifier : Restau' }));
    const fenetre = await screen.findByRole('dialog');
    await userEvent.type(within(fenetre).getByLabelText('Calories (facultatif)'), '700');
    await userEvent.click(within(fenetre).getByRole('button', { name: 'Enregistrer' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(sentBody(fetchMock, 'PATCH /planning/entries/4')).toEqual({
      date: '2026-11-19',
      slotId: 3,
      label: 'Restau',
      caloriesManual: 700,
    });
  });

  it('propose d’ouvrir la recette d’une ligne, et explique une recette retirée', async () => {
    mockApi({ ...base, [SEMAINE]: { body: semaineType() } });
    renderApp('/planning?j=2026-11-16');
    await userEvent.click(
      await screen.findByRole('button', { name: 'Modifier : Soupe de la voisine' }),
    );
    expect(await screen.findByText(/n’est plus disponible/)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Ouvrir la recette/ })).not.toBeInTheDocument();
  });

  it('retire une ligne après confirmation', async () => {
    const fetchMock = mockApi({
      ...base,
      [SEMAINE]: { body: semaineType() },
      'DELETE /planning/entries/2': { status: 204 },
    });
    renderApp('/planning?j=2026-11-19');
    await userEvent.click(await screen.findByRole('button', { name: 'Modifier : Overnight oats' }));
    await userEvent.click(await screen.findByRole('button', { name: /Retirer du planning/ }));
    expect(fetchMock.mock.calls.some(([, o]) => o?.method === 'DELETE')).toBe(false);
    await userEvent.click(
      await screen.findByRole('button', { name: 'Retirer « Overnight oats »' }),
    );
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByText('« Overnight oats » est retiré du planning.')).toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([, o]) => o?.method === 'DELETE')).toBe(true);
  });
});
