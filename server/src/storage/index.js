import { copyFile, mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { env } from '../config/env.js';
import { HttpError } from '../utils/HttpError.js';

// Stockage des photos dans un dossier du serveur (UPLOAD_DIR). Le reste du code ne connaît que cette interface :
// changer de stockage plus tard se fait ici seulement.
// Les photos ne sont jamais servies par une adresse publique : l'API les envoie après avoir vérifié les droits.
const root = path.resolve(env.UPLOAD_DIR);

// Les clés sont fabriquées par l'API, mais on vérifie quand même qu'elles restent dans le dossier.
function resolve(key) {
  const full = path.resolve(root, key);
  if (!full.startsWith(root + path.sep)) throw new Error(`Clé de stockage invalide : ${key}`);
  return full;
}

async function prepare(key) {
  const full = resolve(key);
  await mkdir(path.dirname(full), { recursive: true });
  return full;
}

export const storage = {
  async save(key, buffer) {
    await writeFile(await prepare(key), buffer);
  },

  async copy(fromKey, toKey) {
    await copyFile(resolve(fromKey), await prepare(toKey));
  },

  // Supprime sans erreur si le fichier n'existe déjà plus
  async remove(key) {
    if (key) await rm(resolve(key), { force: true });
  },

  send(res, key, contentType) {
    return new Promise((resolvePromise, reject) => {
      res.sendFile(
        resolve(key),
        { headers: { 'Content-Type': contentType, 'Cache-Control': 'private, max-age=31536000' } },
        (err) => {
          if (!err) return resolvePromise();
          if (err.code === 'ENOENT') return reject(new HttpError(404, 'Photo introuvable'));
          if (res.headersSent) return resolvePromise();
          reject(err);
        },
      );
    });
  },
};
