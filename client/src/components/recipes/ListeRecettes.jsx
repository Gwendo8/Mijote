import CarteRecette from './CarteRecette.jsx';

// Les étiquettes en grille : 2 colonnes sur téléphone, 3 à partir de 768 px (DESIGN.md § 9).
export default function ListeRecettes({ recipes, userId, talons }) {
  return (
    <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-3 min-[1280px]:grid-cols-4">
      {recipes.map((recipe) => (
        <CarteRecette
          key={recipe.id}
          recipe={recipe}
          userId={userId}
          talon={talons?.get(recipe.id)}
        />
      ))}
    </ul>
  );
}
