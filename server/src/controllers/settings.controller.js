import * as settingsService from '../services/settings.service.js';

// Réglage lisible sans être connecté : sert à afficher ou non « Créer un compte »
export async function getPublic(req, res) {
  res.json(await settingsService.get());
}

// Réglages de l'admin
export async function get(req, res) {
  res.json(await settingsService.get());
}

export async function update(req, res) {
  res.json(await settingsService.update(req.validated.body));
}
