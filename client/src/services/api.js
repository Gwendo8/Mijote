const BASE_URL = `${import.meta.env.VITE_API_URL ?? ''}/api`;

// Prévenu quand l'API répond « 401 » : la session a peut-être expiré (SessionProvider vérifie alors /auth/me).
export const UNAUTHORIZED_EVENT = 'mijote:unauthorized';

// Erreur lancée par apiFetch : garde le code HTTP et le détail des champs refusés par l'API.
// Ne jamais afficher error.message tel quel : passer par utils/errorMessage.js.
export class ApiError extends Error {
  constructor(status, message, details = [], retryAfter = null) {
    super(message);
    this.status = status; // 0 = serveur injoignable (réseau coupé, API arrêtée)
    this.details = details;
    this.retryAfter = retryAfter; // 429 : secondes à attendre (en-tête Retry-After), sinon null
  }
}

// Appel à l'API : renvoie le JSON, ou lance une ApiError.
// - `json` : objet envoyé en JSON (le plus courant)
// - `body` : un FormData (photo) : le navigateur pose lui-même l'en-tête multipart, on n'impose rien
export async function apiFetch(path, { json, ...options } = {}) {
  const headers = { ...options.headers };
  let body = options.body;
  if (json !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(json);
  }

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      credentials: 'same-origin',
      ...options,
      headers,
      body,
    });
  } catch {
    throw new ApiError(0, 'Serveur injoignable');
  }

  const data = response.status === 204 ? null : await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 401 && path !== '/auth/me') {
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
    throw new ApiError(
      response.status,
      data?.error?.message ?? `Erreur ${response.status}`,
      data?.error?.details ?? [],
      Number(response.headers.get('Retry-After')) || null,
    );
  }
  return data;
}
