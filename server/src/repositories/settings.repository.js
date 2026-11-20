import { AppSetting } from '../models/index.js';

// Réglages de l'appli : une seule ligne (id = 1), absente = valeurs par défaut (inscription fermée).
export async function get() {
  const row = await AppSetting.findOne();
  return { registrationOpen: row?.registrationOpen ?? false };
}

export async function update({ registrationOpen }) {
  await AppSetting.upsert({ id: 1, registrationOpen });
  return get();
}
