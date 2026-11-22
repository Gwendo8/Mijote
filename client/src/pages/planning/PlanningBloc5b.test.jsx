import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../../test/axe.js';
import { alice, apiError, mockApi, renderApp, sentBody } from '../../test/helpers.jsx';

const lea = { id: 5, firstName: 'Léa', lastName: 'Durand' };
const creneaux = [
  { id: 1, name: 'Petit-déj', position: 0, isDefault: true, isHidden: false },
  { id: 2, name: 'Midi', position: 1, isDefault: true, isHidden: false },
  { id: 3, name: 'Avant le sport', position: 2, isDefault: false, isHidden: false },
];
const base = { 'GET /auth/me': { body: alice } };

const jours = [
  '2026-11-16',
  '2026-11-17',
  '2026-11-18',
  '2026-11-19',
  '2026-11-20',
  '2026-11-21',
  '2026-11-22',
];
const entree = {
  id: 2,
  date: '2026-11-19',
  slotId: 1,
  position: 0,
  label: 'Overnight oats',
  servings: null,
  caloriesManual: null,
  recipe: { id: 7, kind: 'recipe', title: 'Overnight oats', photoUrl: null, isMine: false },
  recipeAvailable: true,
  calories: 380,
  proteins: 10,
};
const semaine = (owner, isMine, entries = [entree]) => ({
  weekStart: '2026-11-16',
  weekEnd: '2026-11-22',
  owner,
  isMine,
  slots: creneaux.slice(0, 2),
  days: jours.map((date) => {
    const list = entries.filter((e) => e.date === date);
    return {
      date,
      entries: list,
      totalCalories: list.length ? 380 : 0,
      totalProteins: 0,
      unknownCount: 0,
    };
  }),
  totals: { calories: entries.length * 380, proteins: 0, unknownCount: 0 },
});

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

describe('Réglages des créneaux', () => {
  beforeEach(() => setDesktop(false));

  const reglages = (extra = {}) => ({
    ...base,
    'GET /planning/slots': { body: creneaux },
    'GET /planning/shares': { body: [] },
    ...extra,
  });

  it('liste les créneaux, accessible, sans suppression pour ceux de base', async () => {
    mockApi(reglages());
    const { container } = renderApp('/planning/reglages');
    expect(await screen.findByText('Avant le sport')).toBeInTheDocument();
    expect(screen.getByText('ajouté par toi')).toBeInTheDocument();
    expect(screen.getAllByText('créneau de base')).toHaveLength(2);
    expect(
      screen.getByRole('button', { name: 'Supprimer « Avant le sport »' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Supprimer « Midi »' })).not.toBeInTheDocument();
    expect(screen.getByText(/Personne ne voit ton planning/)).toBeInTheDocument();
    await expectNoA11yViolations(container);
  });

  it('masque un créneau et le descend', async () => {
    const fetchMock = mockApi(
      reglages({
        'PATCH /planning/slots/1': { body: {} },
        'PATCH /planning/slots/2': { body: {} },
      }),
    );
    renderApp('/planning/reglages');
    await userEvent.click(await screen.findByRole('switch', { name: 'Afficher « Petit-déj »' }));
    await waitFor(() =>
      expect(sentBody(fetchMock, 'PATCH /planning/slots/1')).toEqual({ isHidden: true }),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Descendre « Midi »' }));
    await waitFor(() =>
      expect(sentBody(fetchMock, 'PATCH /planning/slots/2')).toEqual({ position: 2 }),
    );
    expect(screen.getByRole('button', { name: 'Monter « Petit-déj »' })).toBeDisabled();
  });

  it('ajoute et renomme un créneau, et vérifie le nom avant d’envoyer', async () => {
    const fetchMock = mockApi(
      reglages({
        'POST /planning/slots': { status: 201, body: {} },
        'PATCH /planning/slots/3': { body: {} },
      }),
    );
    renderApp('/planning/reglages');
    await userEvent.click(await screen.findByRole('button', { name: 'Ajouter un créneau' }));
    let fenetre = await screen.findByRole('dialog');
    await userEvent.click(within(fenetre).getByRole('button', { name: 'Ajouter' }));
    expect(within(fenetre).getByText('Le nom du créneau est obligatoire')).toBeInTheDocument();
    await userEvent.type(within(fenetre).getByLabelText('Nom'), 'Goûter');
    await userEvent.click(within(fenetre).getByRole('button', { name: 'Ajouter' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(sentBody(fetchMock, 'POST /planning/slots')).toEqual({ name: 'Goûter' });

    await userEvent.click(screen.getByRole('button', { name: 'Renommer « Avant le sport »' }));
    fenetre = await screen.findByRole('dialog');
    const champ = within(fenetre).getByLabelText('Nom');
    await userEvent.clear(champ);
    await userEvent.type(champ, 'Après le sport');
    await userEvent.click(within(fenetre).getByRole('button', { name: 'Renommer' }));
    await waitFor(() =>
      expect(sentBody(fetchMock, 'PATCH /planning/slots/3')).toEqual({ name: 'Après le sport' }),
    );
  });

  it('affiche l’erreur « Ce créneau existe déjà » dans la fenêtre', async () => {
    mockApi(reglages({ 'POST /planning/slots': apiError(409, 'Ce créneau existe déjà') }));
    renderApp('/planning/reglages');
    await userEvent.click(await screen.findByRole('button', { name: 'Ajouter un créneau' }));
    const fenetre = await screen.findByRole('dialog');
    await userEvent.type(within(fenetre).getByLabelText('Nom'), 'Midi');
    await userEvent.click(within(fenetre).getByRole('button', { name: 'Ajouter' }));
    expect(await within(fenetre).findByText('Ce créneau existe déjà')).toBeInTheDocument();
  });

  it('supprime un créneau ajouté seulement après une confirmation qui parle de ses plats', async () => {
    const fetchMock = mockApi(reglages({ 'DELETE /planning/slots/3': { status: 204 } }));
    renderApp('/planning/reglages');
    await userEvent.click(
      await screen.findByRole('button', { name: 'Supprimer « Avant le sport »' }),
    );
    const fenetre = await screen.findByRole('dialog');
    expect(within(fenetre).getByText(/Tous les plats prévus dans ce créneau/)).toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([, o]) => o.method === 'DELETE')).toBe(false);
    await userEvent.click(
      within(fenetre).getByRole('button', { name: /Supprimer le créneau et ses plats/ }),
    );
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(
      fetchMock.mock.calls.some(([u, o]) => u === '/api/planning/slots/3' && o.method === 'DELETE'),
    ).toBe(true);
  });
});

describe('Partage du planning', () => {
  beforeEach(() => setDesktop(false));

  const partages = [
    { id: 1, user: lea, weekStart: null },
    { id: 2, user: null, weekStart: '2026-11-16' },
  ];

  it('liste les partages et en retire un', async () => {
    const fetchMock = mockApi({
      ...base,
      'GET /planning/slots': { body: creneaux },
      'GET /planning/shares': { body: partages },
      'DELETE /planning/shares/2': { status: 204 },
    });
    renderApp('/planning/reglages');
    expect(await screen.findByText('Léa Durand')).toBeInTheDocument();
    expect(screen.getByText('Tout le monde')).toBeInTheDocument();
    expect(screen.getByText('semaine du 16 au 22 novembre')).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole('button', { name: /Retirer le partage : Tout le monde/ }),
    );
    await waitFor(() =>
      expect(
        fetchMock.mock.calls.some(
          ([u, o]) => u === '/api/planning/shares/2' && o.method === 'DELETE',
        ),
      ).toBe(true),
    );
  });

  it('partage à tout le monde, pour une semaine choisie, depuis la page du planning', async () => {
    const fetchMock = mockApi({
      ...base,
      'GET /planning?week=2026-11-16': { body: semaine(alice, true) },
      'POST /planning/shares': { status: 201, body: {} },
    });
    renderApp('/planning?j=2026-11-19');
    await userEvent.click(await screen.findByRole('button', { name: 'Partager mon planning' }));
    const fenetre = await screen.findByRole('dialog');
    await userEvent.click(within(fenetre).getByRole('radio', { name: /Tout le monde/ }));
    await userEvent.click(within(fenetre).getByRole('radio', { name: /Des semaines choisies/ }));
    await userEvent.click(within(fenetre).getByRole('button', { name: 'Partager' }));
    expect(within(fenetre).getByText(/Ajoute au moins une semaine/)).toBeInTheDocument();
    fireEvent.change(within(fenetre).getByLabelText('Un jour de la semaine'), {
      target: { value: '2026-11-19' },
    });
    await userEvent.click(within(fenetre).getByRole('button', { name: 'Ajouter cette semaine' }));
    expect(within(fenetre).getByText('Semaine du 16 au 22 novembre')).toBeInTheDocument();
    await userEvent.click(within(fenetre).getByRole('button', { name: 'Partager' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(sentBody(fetchMock, 'POST /planning/shares')).toEqual({
      userId: null,
      weekStart: '2026-11-16',
    });
  });

  it('partage tout le planning à une personne trouvée par son nom', async () => {
    const fetchMock = mockApi({
      ...base,
      'GET /planning?week=2026-11-16': { body: semaine(alice, true) },
      'GET /users/search?q=L%C3%A9a': { body: [lea] },
      'POST /planning/shares': { status: 201, body: {} },
    });
    renderApp('/planning?j=2026-11-19');
    await userEvent.click(await screen.findByRole('button', { name: 'Partager mon planning' }));
    const fenetre = await screen.findByRole('dialog');
    await userEvent.type(
      within(fenetre).getByLabelText('Chercher une personne par son nom'),
      'Léa',
    );
    await userEvent.click(
      await within(fenetre).findByRole('button', { name: /Ajouter Léa Durand/ }),
    );
    await userEvent.click(within(fenetre).getByRole('button', { name: 'Partager' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(sentBody(fetchMock, 'POST /planning/shares')).toEqual({ userId: 5, weekStart: null });
  });
});

describe('Planning partagé avec moi', () => {
  beforeEach(() => setDesktop(false));

  it('liste les personnes qui ont partagé leur planning', async () => {
    mockApi({
      ...base,
      'GET /planning/shared-with-me': {
        body: [{ owner: lea, allWeeks: false, weeks: ['2026-11-16'] }],
      },
    });
    const { container } = renderApp('/planning/partages');
    const lien = await screen.findByRole('link', { name: /Léa Durand/ });
    expect(lien).toHaveAttribute('href', '/planning/partages/5');
    expect(screen.getByText('semaine du 16 au 22 novembre')).toBeInTheDocument();
    await expectNoA11yViolations(container);
  });

  it('dit quand rien n’est partagé', async () => {
    mockApi({ ...base, 'GET /planning/shared-with-me': { body: [] } });
    renderApp('/planning/partages');
    expect(await screen.findByText(/Personne n’a partagé son planning/)).toBeInTheDocument();
  });

  it('montre le planning d’une personne en lecture seule, sans aucun bouton d’écriture', async () => {
    const fetchMock = mockApi({
      ...base,
      'GET /planning?week=2026-11-16&userId=5': { body: semaine(lea, false) },
    });
    const { container } = renderApp('/planning/partages/5?j=2026-11-19');
    expect(
      await screen.findByRole('heading', { name: 'Planning de Léa Durand', level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByText('Overnight oats')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Modifier/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Ajouter une ligne/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Copier ce jour/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Partager/ })).not.toBeInTheDocument();
    expect(fetchMock.mock.calls.every(([, o]) => (o?.method ?? 'GET') === 'GET')).toBe(true);
    await expectNoA11yViolations(container);
  });

  it('dit clairement qu’une semaine non partagée n’est pas visible', async () => {
    mockApi({
      ...base,
      'GET /planning?week=2026-11-16&userId=5': apiError(404, 'Planning introuvable'),
    });
    renderApp('/planning/partages/5?j=2026-11-19');
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Modifier/ })).not.toBeInTheDocument();
  });
});

describe.each([
  ['téléphone', false],
  ['PC', true],
])('Copier ce jour (%s)', (_name, desktop) => {
  beforeEach(() => setDesktop(desktop));

  it('copie vers plusieurs jours de deux semaines, ajoute sans effacer, et recharge', async () => {
    const fetchMock = mockApi({
      ...base,
      'GET /planning?week=2026-11-16': { body: semaine(alice, true) },
      'POST /planning/copy-day': { status: 201, body: { count: 2, entries: [] } },
    });
    renderApp('/planning?j=2026-11-19');
    await userEvent.click(await screen.findByRole('button', { name: 'Copier ce jour' }));
    const fenetre = await screen.findByRole('dialog');
    expect(within(fenetre).getByText(/ajoutés/)).toBeInTheDocument();
    // le jour de départ n'est pas proposé
    expect(
      within(fenetre).queryByRole('checkbox', { name: /jeudi 19 novembre/i }),
    ).not.toBeInTheDocument();
    expect(within(fenetre).getByRole('button', { name: /^Copier vers/ })).toBeDisabled();
    await userEvent.click(within(fenetre).getByRole('checkbox', { name: /vendredi 20 novembre/i }));
    await userEvent.click(within(fenetre).getByRole('button', { name: 'Semaine suivante' }));
    await userEvent.click(within(fenetre).getByRole('checkbox', { name: /lundi 23 novembre/i }));
    await userEvent.click(within(fenetre).getByRole('button', { name: 'Copier vers 2 jours' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(sentBody(fetchMock, 'POST /planning/copy-day')).toEqual({
      fromDate: '2026-11-19',
      toDates: ['2026-11-20', '2026-11-23'],
    });
    expect(screen.getByText(/2 lignes copiées depuis le jeudi 19 novembre/)).toBeInTheDocument();
    const rechargements = fetchMock.mock.calls.filter(
      ([u]) => u === '/api/planning?week=2026-11-16',
    );
    expect(rechargements).toHaveLength(2);
  });

  it('grise le bouton quand le jour est vide', async () => {
    mockApi({ ...base, 'GET /planning?week=2026-11-16': { body: semaine(alice, true) } });
    renderApp('/planning?j=2026-11-18');
    expect(await screen.findByRole('button', { name: 'Copier ce jour' })).toBeDisabled();
  });

  it('affiche l’erreur de l’API sans fermer la fenêtre', async () => {
    mockApi({
      ...base,
      'GET /planning?week=2026-11-16': { body: semaine(alice, true) },
      'POST /planning/copy-day': apiError(400, 'Plus de 14 jours'),
    });
    renderApp('/planning?j=2026-11-19');
    await userEvent.click(await screen.findByRole('button', { name: 'Copier ce jour' }));
    const fenetre = await screen.findByRole('dialog');
    await userEvent.click(within(fenetre).getByRole('checkbox', { name: /vendredi 20 novembre/i }));
    await userEvent.click(within(fenetre).getByRole('button', { name: /^Copier vers/ }));
    expect(await within(fenetre).findByRole('alert')).toBeInTheDocument();
  });
});
