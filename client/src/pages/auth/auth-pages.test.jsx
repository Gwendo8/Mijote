import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../../test/axe.js';
import { alice, apiError, mockApi, renderApp, sentBody } from '../../test/helpers.jsx';

afterEach(() => vi.unstubAllGlobals());

const anonymous = { 'GET /auth/me': apiError(401, 'Connecte-toi pour continuer') };

describe('Connexion', () => {
  it('est affichée à un visiteur, avec un lien d’inscription si elle est ouverte', async () => {
    mockApi({ ...anonymous, 'GET /settings/public': { body: { registrationOpen: true } } });
    const { container } = renderApp('/connexion');

    expect(await screen.findByRole('link', { name: /créer un compte/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Mot de passe oublié ?' })).toBeInTheDocument();
    await expectNoA11yViolations(container);
  });

  it('cache « Créer un compte » quand les inscriptions sont fermées', async () => {
    const fetchMock = mockApi({
      ...anonymous,
      'GET /settings/public': { body: { registrationOpen: false } },
    });
    renderApp('/connexion');
    await screen.findByRole('button', { name: 'Se connecter' });
    await waitFor(() =>
      expect(fetchMock.mock.calls.some(([u]) => u === '/api/settings/public')).toBe(true),
    );
    expect(screen.queryByRole('link', { name: /créer un compte/i })).not.toBeInTheDocument();
  });

  it('vérifie les champs avant l’envoi', async () => {
    const fetchMock = mockApi({
      ...anonymous,
      'GET /settings/public': { body: { registrationOpen: false } },
    });
    renderApp('/connexion');
    await userEvent.click(await screen.findByRole('button', { name: 'Se connecter' }));

    expect(await screen.findByText('Saisis ton adresse e-mail')).toBeInTheDocument();
    expect(screen.getByText('Saisis ton mot de passe')).toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([u]) => u === '/api/auth/login')).toBe(false);
  });

  it('connecte puis ouvre l’appli', async () => {
    let connected = false;
    const fetchMock = mockApi({
      'GET /auth/me': () =>
        connected ? { body: alice } : apiError(401, 'Connecte-toi pour continuer'),
      'GET /settings/public': { body: { registrationOpen: false } },
      'POST /auth/login': () => {
        connected = true;
        return { body: alice };
      },
    });
    renderApp('/connexion');
    await userEvent.type(await screen.findByLabelText('E-mail'), 'alice@example.fr');
    await userEvent.type(screen.getByLabelText('Mot de passe'), 'secret1!');
    await userEvent.click(screen.getByRole('button', { name: 'Se connecter' }));

    expect(await screen.findByRole('heading', { name: 'Recettes' })).toBeInTheDocument();
    expect(sentBody(fetchMock, 'POST /auth/login')).toEqual({
      email: 'alice@example.fr',
      password: 'secret1!',
    });
  });

  it('affiche le motif du refus, sans message technique', async () => {
    mockApi({
      ...anonymous,
      'GET /settings/public': { body: { registrationOpen: false } },
      'POST /auth/login': apiError(401, 'Adresse e-mail ou mot de passe incorrect'),
    });
    renderApp('/connexion');
    await userEvent.type(await screen.findByLabelText('E-mail'), 'alice@example.fr');
    await userEvent.type(screen.getByLabelText('Mot de passe'), 'faux');
    await userEvent.click(screen.getByRole('button', { name: 'Se connecter' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Adresse e-mail ou mot de passe incorrect',
    );
  });

  it('renvoie un visiteur vers la connexion depuis une page de l’appli', async () => {
    mockApi({ ...anonymous, 'GET /settings/public': { body: { registrationOpen: false } } });
    const { router } = renderApp('/recettes');
    await screen.findByRole('button', { name: 'Se connecter' });
    expect(router.state.location.pathname).toBe('/connexion');
  });
});

describe('Inscription', () => {
  it('par invitation : e-mail verrouillé, envoi avec le jeton', async () => {
    let connected = false;
    const fetchMock = mockApi({
      'GET /auth/me': () => (connected ? { body: alice } : apiError(401, 'x')),
      'GET /auth/invitations/tok_1234567890123456789': {
        body: { email: 'alice@example.fr', expiresAt: '2026-11-26T12:00:00.000Z' },
      },
      'POST /auth/register': () => {
        connected = true;
        return { status: 201, body: alice };
      },
    });
    const { container } = renderApp('/inscription?token=tok_1234567890123456789');

    const email = await screen.findByLabelText('E-mail');
    expect(email).toHaveValue('alice@example.fr');
    expect(email).toHaveAttribute('readonly');
    expect(screen.getByText('Lien valable jusqu’au 26 novembre.')).toBeInTheDocument();
    await expectNoA11yViolations(container);

    await userEvent.type(screen.getByLabelText('Prénom'), 'Alice');
    await userEvent.type(screen.getByLabelText('Nom'), 'Martin');
    await userEvent.type(screen.getByLabelText('Mot de passe'), 'secret1!');
    await userEvent.click(screen.getByRole('button', { name: 'Créer mon compte' }));

    expect(await screen.findByRole('heading', { name: 'Recettes' })).toBeInTheDocument();
    expect(sentBody(fetchMock, 'POST /auth/register')).toEqual({
      firstName: 'Alice',
      lastName: 'Martin',
      email: 'alice@example.fr',
      password: 'secret1!',
      token: 'tok_1234567890123456789',
    });
  });

  it('invitation invalide : message clair', async () => {
    mockApi({
      ...anonymous,
      'GET /auth/invitations/tok_1234567890123456789': apiError(
        404,
        'Invitation invalide ou expirée',
      ),
    });
    renderApp('/inscription?token=tok_1234567890123456789');
    expect(await screen.findByText(/invitation est invalide ou a expiré/)).toBeInTheDocument();
  });

  it('sans invitation et inscriptions fermées : message clair', async () => {
    mockApi({ ...anonymous, 'GET /settings/public': { body: { registrationOpen: false } } });
    renderApp('/inscription');
    expect(await screen.findByText(/Les inscriptions sont fermées/)).toBeInTheDocument();
  });

  it('inscriptions ouvertes : vérifie le mot de passe avec les règles de l’API', async () => {
    mockApi({ ...anonymous, 'GET /settings/public': { body: { registrationOpen: true } } });
    renderApp('/inscription');
    await userEvent.type(await screen.findByLabelText('Prénom'), 'Bob');
    await userEvent.type(screen.getByLabelText('Nom'), 'Durand');
    await userEvent.type(screen.getByLabelText('E-mail'), 'bob@example.fr');
    await userEvent.type(screen.getByLabelText('Mot de passe'), 'court');
    await userEvent.click(screen.getByRole('button', { name: 'Créer mon compte' }));
    expect(
      await screen.findByText('Le mot de passe doit contenir au moins 8 caractères'),
    ).toBeInTheDocument();
  });

  it('montre l’erreur du serveur sous le bon champ', async () => {
    mockApi({
      ...anonymous,
      'GET /settings/public': { body: { registrationOpen: true } },
      'POST /auth/register': apiError(400, 'Données invalides', [
        { path: ['email'], message: 'Adresse e-mail invalide' },
      ]),
    });
    renderApp('/inscription');
    await userEvent.type(await screen.findByLabelText('Prénom'), 'Bob');
    await userEvent.type(screen.getByLabelText('Nom'), 'Durand');
    await userEvent.type(screen.getByLabelText('E-mail'), 'bob@example.fr');
    await userEvent.type(screen.getByLabelText('Mot de passe'), 'secret1!');
    await userEvent.click(screen.getByRole('button', { name: 'Créer mon compte' }));
    expect(await screen.findByText('Adresse e-mail invalide')).toBeInTheDocument();
  });
});

describe('Mot de passe oublié', () => {
  it('annonce l’envoi sans révéler si le compte existe', async () => {
    const fetchMock = mockApi({ ...anonymous, 'POST /auth/forgot-password': { status: 204 } });
    const { container } = renderApp('/mot-de-passe-oublie');
    await userEvent.type(await screen.findByLabelText('E-mail'), 'alice@example.fr');
    await userEvent.click(screen.getByRole('button', { name: 'Recevoir le lien' }));

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Si un compte existe pour cette adresse',
    );
    expect(sentBody(fetchMock, 'POST /auth/forgot-password')).toEqual({
      email: 'alice@example.fr',
    });
    await expectNoA11yViolations(container);
  });

  it('refuse une adresse invalide', async () => {
    mockApi(anonymous);
    renderApp('/mot-de-passe-oublie');
    await userEvent.type(await screen.findByLabelText('E-mail'), 'pas-une-adresse');
    await userEvent.click(screen.getByRole('button', { name: 'Recevoir le lien' }));
    expect(await screen.findByText('Adresse e-mail invalide')).toBeInTheDocument();
  });

  it('dit quand le serveur est injoignable', async () => {
    mockApi(anonymous);
    renderApp('/mot-de-passe-oublie');
    await userEvent.type(await screen.findByLabelText('E-mail'), 'alice@example.fr');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('réseau')));
    await userEvent.click(screen.getByRole('button', { name: 'Recevoir le lien' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Impossible de joindre le serveur');
  });
});

const resetLink = {
  'GET /auth/reset-password/tok_1234567890123456789': {
    body: { email: 'alice@example.fr', expiresAt: '2026-11-26T12:00:00.000Z' },
  },
};

describe('Nouveau mot de passe', () => {
  it('change le mot de passe puis propose la connexion', async () => {
    const fetchMock = mockApi({
      ...anonymous,
      ...resetLink,
      'POST /auth/reset-password': { status: 204 },
    });
    const { container } = renderApp('/mot-de-passe?token=tok_1234567890123456789');
    await userEvent.type(await screen.findByLabelText('Nouveau mot de passe'), 'nouveau1!');
    expect(screen.getByText('pour alice@example.fr')).toBeInTheDocument();
    expect(screen.getByText(/Lien valable jusqu’au 26 novembre/)).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Le même, une deuxième fois'), 'nouveau1!');
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer le mot de passe' }));

    expect(await screen.findByText(/Mot de passe changé/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Aller à la connexion' })).toBeInTheDocument();
    expect(sentBody(fetchMock, 'POST /auth/reset-password')).toEqual({
      token: 'tok_1234567890123456789',
      password: 'nouveau1!',
    });
    await expectNoA11yViolations(container);
  });

  it('refuse deux mots de passe différents', async () => {
    const fetchMock = mockApi({ ...anonymous, ...resetLink });
    renderApp('/mot-de-passe?token=tok_1234567890123456789');
    await userEvent.type(await screen.findByLabelText('Nouveau mot de passe'), 'nouveau1!');
    await userEvent.type(screen.getByLabelText('Le même, une deuxième fois'), 'autre1!!');
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer le mot de passe' }));
    expect(
      await screen.findByText('Les deux mots de passe ne sont pas identiques.'),
    ).toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([u]) => u === '/api/auth/reset-password')).toBe(false);
  });

  it('lien sans jeton : message clair', async () => {
    mockApi(anonymous);
    renderApp('/mot-de-passe');
    expect(await screen.findByText(/Ce lien n’est plus valable/)).toBeInTheDocument();
  });

  it('lien invalide dès l’ouverture : état d’erreur, pas de formulaire', async () => {
    mockApi({
      ...anonymous,
      'GET /auth/reset-password/tok_1234567890123456789': apiError(400, 'Lien invalide ou expiré'),
    });
    renderApp('/mot-de-passe?token=tok_1234567890123456789');
    expect(await screen.findByText(/Ce lien n’est plus valable/)).toBeInTheDocument();
    expect(screen.queryByLabelText('Nouveau mot de passe')).not.toBeInTheDocument();
  });

  it('lien expiré : erreur du serveur affichée', async () => {
    mockApi({
      ...anonymous,
      ...resetLink,
      'POST /auth/reset-password': apiError(400, 'Données invalides', [
        { path: ['token'], message: 'Ce lien n’est plus valable' },
      ]),
    });
    renderApp('/mot-de-passe?token=tok_1234567890123456789');
    await userEvent.type(await screen.findByLabelText('Nouveau mot de passe'), 'nouveau1!');
    await userEvent.type(screen.getByLabelText('Le même, une deuxième fois'), 'nouveau1!');
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer le mot de passe' }));
    expect(await screen.findByText('Ce lien n’est plus valable')).toBeInTheDocument();
  });
});
