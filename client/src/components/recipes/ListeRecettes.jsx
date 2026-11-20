import CarteRecette from './CarteRecette.jsx';

// Les étiquettes en grille : 2 colonnes sur téléphone, 3 à partir de 768 px (DESIGN.md § 9).
// Quand le panneau de la fiche est ouvert sur PC (`etroite`), il reste 2 colonnes jusqu'à 1280 px pour que les étiquettes respirent.
export default function ListeRecettes({ recipes, userId, onOpen, selectedId, etroite = false }) {
  return (
    <ul className={`grid grid-cols-2 gap-3.5 ${etroite ? 'xl:grid-cols-3' : 'md:grid-cols-3'}`}>
      {recipes.map((recipe) => (
        <CarteRecette
          key={recipe.id}
          recipe={recipe}
          userId={userId}
          onOpen={onOpen}
          selected={selectedId === recipe.id}
        />
      ))}
    </ul>
  );
}
