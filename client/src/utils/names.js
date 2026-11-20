// Affichage des noms (règle de l'appli) : soi-même par le prénom, les autres en « Prénom Nom ».
// `lastName` peut être vide (comptes créés avant la séparation) : pas d'espace en trop.

// « Prénom Nom », sans espace en trop. Sert pour les autres personnes (partages, planning…).
export function fullName(person) {
  if (!person) return '';
  return [person.firstName, person.lastName]
    .map((part) => (part ?? '').trim())
    .filter(Boolean)
    .join(' ');
}

// Le prénom seul : pour parler de soi-même (titre du profil, accueil…).
export function firstNameOf(person) {
  return (person?.firstName ?? '').trim();
}

// Selon la personne : le prénom si c'est le compte connecté, « Prénom Nom » sinon.
export function displayNameFor(person, currentUserId) {
  return person && person.id === currentUserId ? firstNameOf(person) : fullName(person);
}
