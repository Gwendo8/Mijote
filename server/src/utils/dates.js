// Jours du calendrier en texte « AAAA-MM-JJ », calculés en UTC pour ne pas dépendre du fuseau horaire.
const DAY_MS = 86_400_000;
const asTime = (date) => Date.parse(`${date}T00:00:00Z`);

export const isValidDate = (value) =>
  typeof value === 'string' &&
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  new Date(asTime(value)).toISOString().slice(0, 10) === value;

export const addDays = (date, days) =>
  new Date(asTime(date) + days * DAY_MS).toISOString().slice(0, 10);

// Lundi de la semaine qui contient ce jour
export const mondayOf = (date) => addDays(date, -((new Date(asTime(date)).getUTCDay() + 6) % 7));

// Aujourd'hui, dans le fuseau du serveur
export function today() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}
