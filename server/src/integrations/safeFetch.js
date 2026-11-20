import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { HttpError } from '../utils/HttpError.js';

// Télécharge une page ou une image donnée par une utilisatrice, sans que le serveur puisse servir de
// porte d'entrée vers le réseau de la maison (attaque « SSRF ») :
// - seulement http et https, sans identifiant dans l'adresse ;
// - le nom de domaine est résolu en adresse IP et toute adresse interne est refusée
//   (127.x, 10.x, 192.168.x, 169.254.x, IPv6 locales...), à chaque redirection aussi ;
// - 3 redirections, 10 secondes et une taille maximale pour tout le téléchargement.
// Limite connue : entre la vérification DNS et la connexion de fetch, un domaine malveillant pourrait changer
// d'adresse (« DNS rebinding »). Le risque est faible pour une appli perso ; le fermer demanderait de choisir
// soi-même l'adresse de connexion, ce que fetch ne permet pas sans dépendance.

export const FETCH_TIMEOUT_MS = 10_000;
const MAX_REDIRECTS = 3;
const REFUSED = new HttpError(400, 'Cette adresse n’est pas autorisée');

function ipv4IsInternal(ip) {
  const [a, b] = ip.split('.').map(Number);
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) || // 100.64.0.0/10 (réseau d'opérateur)
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 192 && b === 0) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224 // multicast et réservées
  );
}

export function ipIsInternal(ip) {
  if (isIP(ip) === 4) return ipv4IsInternal(ip);
  const address = ip.toLowerCase();
  // IPv6 qui cache une IPv4 (::ffff:127.0.0.1 ou ::ffff:7f00:1) : on juge l'IPv4
  const mapped = address.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return ipv4IsInternal(mapped[1]);
  const hex = address.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
  if (hex) {
    const high = parseInt(hex[1], 16);
    const low = parseInt(hex[2], 16);
    return ipv4IsInternal([high >> 8, high & 255, low >> 8, low & 255].join('.'));
  }
  return (
    address === '::' ||
    address === '::1' ||
    /^f[cd]/.test(address) || // fc00::/7 (adresses privées)
    /^fe[89ab]/.test(address) || // fe80::/10 (lien local)
    /^ff/.test(address) // multicast
  );
}

async function assertPublicHost(hostname) {
  const host = hostname.replace(/^\[|\]$/g, '');
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local')) throw REFUSED;
  if (isIP(host)) {
    if (ipIsInternal(host)) throw REFUSED;
    return;
  }
  let addresses;
  try {
    addresses = await lookup(host, { all: true });
  } catch {
    throw new HttpError(502, 'Impossible de joindre cette page');
  }
  if (addresses.length === 0 || addresses.some(({ address }) => ipIsInternal(address))) {
    throw REFUSED;
  }
}

function parseUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new HttpError(400, 'Adresse invalide');
  }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    throw new HttpError(400, 'Adresse invalide');
  }
  return url;
}

// Lit le corps par morceaux et s'arrête dès que la taille maximale est dépassée
async function readBody(response, maxBytes) {
  const tooBig = new HttpError(502, 'Cette page est trop lourde');
  const declared = Number(response.headers.get('content-length'));
  if (declared > maxBytes) throw tooBig;

  const chunks = [];
  let size = 0;
  const reader = response.body.getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel();
      throw tooBig;
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks);
}

// Renvoie { buffer, contentType, finalUrl }
export async function safeFetch(rawUrl, { maxBytes, accept = '*/*' }) {
  const signal = AbortSignal.timeout(FETCH_TIMEOUT_MS);
  let url = parseUrl(rawUrl);

  try {
    for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
      await assertPublicHost(url.hostname);
      const response = await fetch(url, {
        redirect: 'manual',
        signal,
        headers: { 'User-Agent': 'Mijote/1.0 (appli perso de cuisine)', Accept: accept },
      });

      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get('location');
        await response.body?.cancel();
        if (!location) throw new HttpError(502, 'Impossible de joindre cette page');
        url = parseUrl(new URL(location, url).href);
        continue;
      }
      if (!response.ok) {
        await response.body?.cancel();
        throw new HttpError(502, 'Impossible de joindre cette page');
      }
      return {
        buffer: await readBody(response, maxBytes),
        contentType: response.headers.get('content-type') ?? '',
        finalUrl: url.href,
      };
    }
  } catch (error) {
    if (error instanceof HttpError) throw error;
    // délai dépassé, connexion refusée, certificat invalide...
    throw new HttpError(502, 'Impossible de joindre cette page');
  }
  throw new HttpError(502, 'Cette page redirige trop de fois');
}
