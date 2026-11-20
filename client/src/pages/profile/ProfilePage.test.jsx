import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../../test/axe.js';
import { admin, alice, apiError, mockApi, renderApp, sentBody } from '../../test/helpers.jsx';

afterEach(() => {
  vi.unstubAllGlobals();
  delete window.matchMedia;
  localStorage.clear();
  document.documentElement.setAttribute('data-theme', 'light');
});

// Sur PC (1024 px et plus) les formulaires sont dans la page ; sur téléphone ils s'ouvrent dans une fenêtre.
function setDesktop(matches) {
  window.matchMedia = vi.fn().mockImplementation(() => ({
    matches,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
}

describe('Profil', () => {
  beforeEach(() => setDesktop(true));

  it('affiche les informations et est accessible', async () => {
    mockApi({ 'GET /auth/me': { body: alice } });
    const { container } = renderApp('/profil');
    expect(await screen.findByLabelText('Prénom')).toHaveValue('Alice');
    expect(screen.getByLabelText('Nom')).toHaveValue('Martin');
    expect(screen.getByLabelText('E-mail')).toHaveValue('alice@example.fr');
    await expectNoA11yViolations(container);
  });

  it('enregistre le nom et pose le tampon de confirmation', async () => {
    const fetchMock = mockApi({
      'GET /auth/me': { body: alice },
      'PATCH /me': { body: { ...alice, firstName: 'Alice D.' } },
    });
    renderApp('/profil');
    const name = await screen.findByLabelText('Prénom');
    await userEvent.clear(name);
    await userEvent.type(name, 'Alice D.');
    await userEvent.click(screen.getAllByRole('button', { name: 'Enregistrer' })[0]);

    expect(await screen.findByText('Informations enregistrées.')).toBeInTheDocument();
    expect(sentBody(fetchMock, 'PATCH /me')).toEqual({ firstName: 'Alice D.', lastName: 'Martin' });
  });

  it('demande le mot de passe actuel pour changer d’adresse', async () => {
    const fetchMock = mockApi({
      'GET /auth/me': { body: alice },
      'PATCH /me': { body: { ...alice, email: 'neuf@example.fr' } },
    });
    renderApp('/profil');
    const email = await screen.findByLabelText('E-mail');
    expect(
      screen.queryByLabelText('Mot de passe actuel', { selector: '#x' }),
    ).not.toBeInTheDocument();
    await userEvent.clear(email);
    await userEvent.type(email, 'neuf@example.fr');
    await userEvent.click(screen.getAllByRole('button', { name: 'Enregistrer' })[0]);
    expect(
      await screen.findByText('Saisis ton mot de passe actuel pour changer d’adresse'),
    ).toBeInTheDocument();

    await userEvent.type(screen.getAllByLabelText('Mot de passe actuel')[0], 'secret1!');
    await userEvent.click(screen.getAllByRole('button', { name: 'Enregistrer' })[0]);
    expect(await screen.findByText('Informations enregistrées.')).toBeInTheDocument();
    expect(sentBody(fetchMock, 'PATCH /me')).toEqual({
      firstName: 'Alice',
      lastName: 'Martin',
      email: 'neuf@example.fr',
      currentPassword: 'secret1!',
    });
  });

  it('affiche un conflit d’adresse', async () => {
    mockApi({
      'GET /auth/me': { body: alice },
      'PATCH /me': apiError(409, 'Cette adresse est déjà utilisée'),
    });
    renderApp('/profil');
    const email = await screen.findByLabelText('E-mail');
    await userEvent.clear(email);
    await userEvent.type(email, 'autre@example.fr');
    await userEvent.type(screen.getAllByLabelText('Mot de passe actuel')[0], 'secret1!');
    await userEvent.click(screen.getAllByRole('button', { name: 'Enregistrer' })[0]);
    expect(await screen.findByRole('alert')).toHaveTextContent('Cette adresse est déjà utilisée');
  });

  it('change le mot de passe (règles vérifiées avant l’envoi)', async () => {
    const fetchMock = mockApi({
      'GET /auth/me': { body: alice },
      'PUT /me/password': { status: 204 },
    });
    renderApp('/profil');
    const current = (await screen.findAllByLabelText('Mot de passe actuel'))[0];
    await userEvent.type(current, 'ancien1!');
    await userEvent.type(screen.getByLabelText('Nouveau'), 'court');
    await userEvent.click(screen.getByRole('button', { name: 'Changer le mot de passe' }));
    expect(
      await screen.findByText('Le mot de passe doit contenir au moins 8 caractères'),
    ).toBeInTheDocument();

    await userEvent.clear(screen.getByLabelText('Nouveau'));
    await userEvent.type(screen.getByLabelText('Nouveau'), 'nouveau1!');
    await userEvent.click(screen.getByRole('button', { name: 'Changer le mot de passe' }));
    expect(await screen.findByText(/Mot de passe changé/)).toBeInTheDocument();
    expect(sentBody(fetchMock, 'PUT /me/password')).toEqual({
      currentPassword: 'ancien1!',
      newPassword: 'nouveau1!',
    });
  });

  it('garde le thème choisi sur l’appareil (clair par défaut)', async () => {
    mockApi({ 'GET /auth/me': { body: alice } });
    renderApp('/profil');
    expect(await screen.findByRole('button', { name: 'Clair' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Sombre' }));
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    expect(localStorage.getItem('mijote-theme')).toBe('dark');
  });

  it('se déconnecte de cet appareil puis revient à la connexion', async () => {
    let connected = true;
    const fetchMock = mockApi({
      'GET /auth/me': () => (connected ? { body: alice } : apiError(401, 'x')),
      'GET /settings/public': { body: { registrationOpen: false } },
      'POST /auth/logout': () => {
        connected = false;
        return { status: 204 };
      },
    });
    const { router } = renderApp('/profil');
    await userEvent.click(await screen.findByRole('button', { name: 'Se déconnecter' }));
    await screen.findByRole('button', { name: 'Se connecter' });
    expect(router.state.location.pathname).toBe('/connexion');
    expect(fetchMock.mock.calls.some(([u]) => u === '/api/auth/logout')).toBe(true);
  });

  it('se déconnecte partout', async () => {
    let connected = true;
    const fetchMock = mockApi({
      'GET /auth/me': () => (connected ? { body: alice } : apiError(401, 'x')),
      'GET /settings/public': { body: { registrationOpen: false } },
      'POST /auth/logout-all': () => {
        connected = false;
        return { status: 204 };
      },
    });
    renderApp('/profil');
    await userEvent.click(
      await screen.findByRole('button', { name: 'Me déconnecter de tous les appareils' }),
    );
    await screen.findByRole('button', { name: 'Se connecter' });
    expect(fetchMock.mock.calls.some(([u]) => u === '/api/auth/logout-all')).toBe(true);
  });

  it('supprime le compte après confirmation avec le mot de passe', async () => {
    let connected = true;
    const fetchMock = mockApi({
      'GET /auth/me': () => (connected ? { body: alice } : apiError(401, 'x')),
      'GET /settings/public': { body: { registrationOpen: false } },
      'DELETE /me': () => {
        connected = false;
        return { status: 204 };
      },
    });
    renderApp('/profil');
    await userEvent.click(await screen.findByRole('button', { name: 'Supprimer mon compte' }));
    const dialog = screen.getByRole('dialog');
    // Sans mot de passe : refusé avant l'envoi
    await userEvent.click(
      within(dialog).getByRole('button', { name: /Supprimer mon compte et tout/ }),
    );
    expect(await within(dialog).findByText('Saisis ton mot de passe')).toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([, o]) => o?.method === 'DELETE')).toBe(false);

    await userEvent.type(within(dialog).getByLabelText('Mot de passe'), 'secret1!');
    await userEvent.click(
      within(dialog).getByRole('button', { name: /Supprimer mon compte et tout/ }),
    );
    await screen.findByRole('button', { name: 'Se connecter' });
    expect(sentBody(fetchMock, 'DELETE /me')).toEqual({ password: 'secret1!' });
  });

  it('affiche le refus (mauvais mot de passe) dans la fenêtre', async () => {
    mockApi({
      'GET /auth/me': { body: alice },
      'DELETE /me': apiError(401, 'Mot de passe incorrect'),
    });
    renderApp('/profil');
    await userEvent.click(await screen.findByRole('button', { name: 'Supprimer mon compte' }));
    const dialog = screen.getByRole('dialog');
    await userEvent.type(within(dialog).getByLabelText('Mot de passe'), 'faux');
    await userEvent.click(
      within(dialog).getByRole('button', { name: /Supprimer mon compte et tout/ }),
    );
    expect(await within(dialog).findByRole('alert')).toHaveTextContent('Mot de passe incorrect');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Annuler' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });
});

describe('Nom manquant', () => {
  it('invite à compléter le nom quand il est vide (PC)', async () => {
    setDesktop(true);
    mockApi({ 'GET /auth/me': { body: { ...alice, lastName: '' } } });
    renderApp('/profil');
    expect(await screen.findByText(/Ton nom manque/)).toBeInTheDocument();
  });

  it('le propose aussi sur téléphone et ouvre la fenêtre', async () => {
    setDesktop(false);
    mockApi({ 'GET /auth/me': { body: { ...alice, lastName: '' } } });
    renderApp('/profil');
    await userEvent.click(await screen.findByRole('button', { name: 'complète-le' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('ne dit rien quand le nom est là', async () => {
    setDesktop(true);
    mockApi({ 'GET /auth/me': { body: alice } });
    renderApp('/profil');
    await screen.findByLabelText('Prénom');
    expect(screen.queryByText(/Ton nom manque/)).not.toBeInTheDocument();
  });
});

describe('Profil sur téléphone', () => {
  it('résume le compte et ouvre les formulaires dans une fenêtre', async () => {
    setDesktop(false);
    const fetchMock = mockApi({
      'GET /auth/me': { body: alice },
      'PATCH /me': { body: { ...alice, firstName: 'Alice D.' } },
    });
    const { container } = renderApp('/profil');
    expect(await screen.findByText('compte créé le')).toBeInTheDocument();
    expect(screen.queryByLabelText('Prénom')).not.toBeInTheDocument();
    await expectNoA11yViolations(container);

    await userEvent.click(screen.getByRole('button', { name: 'Modifier' }));
    const dialog = screen.getByRole('dialog');
    const name = within(dialog).getByLabelText('Prénom');
    await userEvent.clear(name);
    await userEvent.type(name, 'Alice D.');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Enregistrer' }));

    expect(await screen.findByText('Informations enregistrées.')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(sentBody(fetchMock, 'PATCH /me')).toEqual({ firstName: 'Alice D.', lastName: 'Martin' });
  });
});

describe('Navigation et droits', () => {
  it('propose les 5 entrées et pas l’admin à un simple utilisateur', async () => {
    mockApi({ 'GET /auth/me': { body: alice } });
    renderApp('/recettes');
    const nav = (await screen.findAllByRole('navigation', { name: 'Onglets' }))[0];
    expect(
      within(nav)
        .getAllByRole('link')
        .map((l) => l.textContent.trim()),
    ).toEqual(expect.arrayContaining(['Recettes', 'Idées', 'Planning', 'Aliments']));
    expect(within(nav).queryByRole('link', { name: 'Courses' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Administration' })).not.toBeInTheDocument();
  });

  it('montre l’entrée admin à un admin et ouvre /admin', async () => {
    mockApi({ 'GET /auth/me': { body: admin } });
    renderApp('/admin');
    expect(await screen.findByRole('heading', { name: 'Administration' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Administration' })).toBeInTheDocument();
  });

  it('renvoie un simple utilisateur qui ouvre /admin', async () => {
    mockApi({ 'GET /auth/me': { body: alice } });
    const { router } = renderApp('/admin');
    await screen.findByRole('heading', { name: 'Recettes' });
    expect(router.state.location.pathname).toBe('/recettes');
  });

  it('affiche « page introuvable » pour une adresse inconnue', async () => {
    mockApi({ 'GET /auth/me': { body: alice } });
    const { container } = renderApp('/nimporte-quoi');
    expect(await screen.findByRole('heading', { name: 'Page introuvable' })).toBeInTheDocument();
    await expectNoA11yViolations(container);
  });

  it('propose de réessayer quand le serveur est injoignable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('réseau')));
    renderApp('/recettes');
    expect(await screen.findByText(/Impossible de joindre le serveur/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Réessayer' })).toBeInTheDocument();
  });

  it('une session expirée en cours d’usage ramène à la connexion', async () => {
    setDesktop(true);
    let connected = true;
    mockApi({
      'GET /auth/me': () => (connected ? { body: alice } : apiError(401, 'x')),
      'GET /settings/public': { body: { registrationOpen: false } },
      'PUT /me/password': () => {
        connected = false;
        return apiError(401, 'Connecte-toi pour continuer');
      },
    });
    renderApp('/profil');
    await userEvent.type((await screen.findAllByLabelText('Mot de passe actuel'))[0], 'ancien1!');
    await userEvent.type(screen.getByLabelText('Nouveau'), 'nouveau1!');
    await userEvent.click(screen.getByRole('button', { name: 'Changer le mot de passe' }));
    expect(await screen.findByRole('button', { name: 'Se connecter' })).toBeInTheDocument();
  });
});
