import multer from 'multer';
import { MAX_PHOTO_BYTES } from '../services/recipe-photos.service.js';
import { HttpError } from '../utils/HttpError.js';

// Réception de la photo d'une recette (champ « photo »), gardée en mémoire le temps de la réduire.
// Le format est vérifié plus tard, sur le contenu de l'image (recipe-photos.service.js).
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_PHOTO_BYTES, files: 1 },
}).single('photo');

export function uploadPhoto(req, res, next) {
  upload(req, res, (error) => {
    if (error instanceof multer.MulterError) {
      return next(new HttpError(400, 'Image invalide ou trop lourde'));
    }
    if (!error && !req.file) return next(new HttpError(400, 'Image invalide ou trop lourde'));
    next(error);
  });
}
