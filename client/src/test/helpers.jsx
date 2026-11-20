import { render } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { vi } from 'vitest';
import { routes } from '../router.jsx';

export const alice = {
  id: 1,
  email: 'alice@example.fr',
  firstName: 'Alice',
  lastName: 'Martin',
  role: 'user',
};
export const admin = { ...alice, id: 2, role: 'admin' };

// Imite l'API : `handlers` associe « METHODE /chemin » à une réponse ({ status?, body? }) ou une fonction.
// Les appels sont gardés dans fetch.mock.calls pour vérifier méthode, chemin et corps.
export function mockApi(handlers = {}) {
  const fetchMock = vi.fn(async (url, options = {}) => {
    const key = `${options.method ?? 'GET'} ${String(url).replace(/^\/api/, '')}`;
    const handler = handlers[key];
    if (!handler)
      return Response.json({ error: { message: `Non imité : ${key}` } }, { status: 500 });
    const { status = 200, body = null } =
      typeof handler === 'function' ? await handler(options) : handler;
    return status === 204 ? new Response(null, { status }) : Response.json(body, { status });
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

export const apiError = (status, message, details) => ({
  status,
  body: { error: { message, ...(details ? { details } : {}) } },
});

// Affiche l'appli entière (vraies routes, vrais hooks et services) à une adresse donnée.
export function renderApp(path = '/') {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  return { router, ...render(<RouterProvider router={router} />) };
}

// Corps JSON envoyé lors du n-ième appel qui vise `key`.
export function sentBody(fetchMock, key) {
  const call = fetchMock.mock.calls.find(
    ([url, options = {}]) =>
      `${options.method ?? 'GET'} ${String(url).replace(/^\/api/, '')}` === key,
  );
  return call ? JSON.parse(call[1].body) : undefined;
}
