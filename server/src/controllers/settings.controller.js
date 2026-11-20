import * as settingsRepository from '../repositories/settings.repository.js';

// Réglage lisible sans être connecté : sert à afficher ou non « Créer un compte »
export async function getPublic(req, res) {
  res.json(await settingsRepository.get());
}
