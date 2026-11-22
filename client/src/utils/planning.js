// Outils du planning : dates en heure locale (« 2026-11-19 »), semaines du lundi au dimanche, affichages.
// Les dates sont toujours calculées avec le jour, le mois et l'année locaux (jamais en UTC) : sinon un jour
// pourrait glisser d'un cran selon l'heure et le fuseau.

const pad = (n) => String(n).padStart(2, '0');

export const toIso = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export function parseIso(iso) {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export const today = () => toIso(new Date());

export function addDays(iso, days) {
  const date = parseIso(iso);
  date.setDate(date.getDate() + days);
  return toIso(date);
}

// Le lundi de la semaine qui contient cette date.
export function mondayOf(iso) {
  const date = parseIso(iso);
  const sinceMonday = (date.getDay() + 6) % 7;
  return addDays(iso, -sinceMonday);
}

export const weekDays = (monday) => Array.from({ length: 7 }, (_, i) => addDays(monday, i));

// Une date lisible, selon le format demandé.
const format = (iso, options) => parseIso(iso).toLocaleDateString('fr-FR', options);

// « 16 au 22 novembre », ou « 28 septembre au 4 octobre » à cheval sur deux mois.
export function formatSemaine(monday) {
  const sunday = addDays(monday, 6);
  const debut = parseIso(monday);
  const fin = parseIso(sunday);
  const jourFin = format(sunday, { day: 'numeric', month: 'long' });
  const jourDebut =
    debut.getMonth() === fin.getMonth()
      ? String(debut.getDate())
      : format(monday, { day: 'numeric', month: 'long' });
  return `${jourDebut} au ${jourFin}`;
}

export const jourCourt = (iso) => format(iso, { weekday: 'short' }).replace('.', '');
export const numeroJour = (iso) => parseIso(iso).getDate();
// « jeudi 19 novembre »
export const jourComplet = (iso) => format(iso, { weekday: 'long', day: 'numeric', month: 'long' });

// 1495 → « 1 495 » (espace insécable à la française). Rien n'est arrondi à 0 par erreur : null reste null.
export function formatNombre(value) {
  if (value === null || value === undefined) return null;
  return Math.round(value).toLocaleString('fr-FR');
}

// 1.5 → « 1,5 »
export const formatParts = (servings) => String(servings).replace('.', ',');

// Les entrées d'un jour regroupées par créneau, dans l'ordre des créneaux ; les créneaux vides sont laissés de côté.
export function groupBySlot(entries, slots) {
  return slots
    .map((slot) => ({ slot, entries: entries.filter((entry) => entry.slotId === slot.id) }))
    .filter((group) => group.entries.length > 0);
}

// Résumé de la semaine : jours avec au moins un plat, total, moyenne par jour rempli.
export function resumeSemaine(week) {
  const joursRemplis = week.days.filter((day) => day.entries.length > 0).length;
  const calories = week.totals.calories;
  return {
    joursRemplis,
    calories,
    proteins: week.totals.proteins,
    moyenne: joursRemplis > 0 ? Math.round(calories / joursRemplis) : null,
    inconnues: week.totals.unknownCount ?? 0,
  };
}
