import { AppSetting } from '../models/index.js';

// Réglages de l'appli : une seule ligne, absente = valeurs par défaut (inscription fermée).
export async function get() {
  const row = await AppSetting.findOne();
  return { registrationOpen: row?.registrationOpen ?? false };
}
