import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { safeFetch } from '../integrations/safeFetch.js';
import { storage } from '../storage/index.js';
import { HttpError } from '../utils/HttpError.js';

// Fichiers des photos de recettes : réduction (1200 px de large au plus, WebP) et rangement sur le disque.
// Les chemins sont gardés dans recipes.photo_path ; ce service ne touche pas à la base.
export const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
const MAX_WIDTH = 1200;
const MAX_INPUT_PIXELS = 50_000_000; // refuse les « bombes » : petite image en octets, gigantesque en pixels
const ACCEPTED_FORMATS = ['jpeg', 'png', 'webp', 'heif', 'avif'];
const INVALID = 'Image invalide ou trop lourde';

// Réduit l'image ; lance 400 si ce n'est pas une image acceptée
async function shrink(buffer) {
  try {
    const image = sharp(buffer, { limitInputPixels: MAX_INPUT_PIXELS });
    const { format } = await image.metadata();
    if (!ACCEPTED_FORMATS.includes(format)) throw new Error('format');
    return await image
      .rotate() // applique l'orientation des photos de téléphone
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
  } catch {
    throw new HttpError(400, INVALID);
  }
}

// Réduit et range une image reçue ; renvoie la clé de stockage
export async function storeUpload(buffer) {
  const key = `recipes/${randomUUID()}.webp`;
  await storage.save(key, await shrink(buffer));
  return key;
}

// Télécharge l'image d'une adresse (import par lien). Un échec n'est pas une erreur : la recette se crée sans photo.
export async function storeFromUrl(url) {
  try {
    const { buffer } = await safeFetch(url, { maxBytes: MAX_PHOTO_BYTES, accept: 'image/*' });
    return await storeUpload(buffer);
  } catch (error) {
    console.warn(`Photo de l'import non récupérée (${url}) : ${error.message}`);
    return null;
  }
}

// Copie un fichier sous une nouvelle clé (copie d'une recette) ; null si l'original a disparu
export async function duplicate(key) {
  if (!key) return null;
  const copyKey = `recipes/${randomUUID()}.webp`;
  try {
    await storage.copy(key, copyKey);
    return copyKey;
  } catch {
    return null;
  }
}

// Efface des fichiers sans jamais faire échouer l'opération en cours
export async function removeFiles(keys) {
  await Promise.all(
    keys.filter(Boolean).map((key) =>
      storage.remove(key).catch((error) => {
        console.warn(`Photo non effacée (${key}) : ${error.message}`);
      }),
    ),
  );
}

export const send = (res, key) => storage.send(res, key, 'image/webp');
