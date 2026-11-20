// « 26 novembre » : jour et mois en toutes lettres, pour les dates de validité des liens.
export function formatJourMois(iso) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
}

// « 14 h 30 » : heure à la française.
export function formatHeure(iso) {
  const date = new Date(iso);
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${date.getHours()} h ${minutes}`;
}

// Fin de validité d'un lien court (mot de passe oublié, 1 heure) :
// « jusqu'à 14 h 30 » le jour même, sinon « jusqu'au 27 novembre à 0 h 30 ».
export function formatJusqua(iso, now = new Date()) {
  const date = new Date(iso);
  const memeJour = date.toDateString() === now.toDateString();
  return memeJour
    ? `jusqu’à ${formatHeure(iso)}`
    : `jusqu’au ${formatJourMois(iso)} à ${formatHeure(iso)}`;
}
