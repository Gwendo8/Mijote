import { Link } from 'react-router';
import Etiquette from '../ui/Etiquette.jsx';
import { detailEtiquette } from '../../utils/recipes.js';
import { displayNameFor } from '../../utils/names.js';

// Une recette dans la liste : l'étiquette de marché, qui est un lien vers la fiche.
// `userId` sert à écrire « de Léa » sous les recettes des autres.
export default function CarteRecette({ recipe, userId }) {
  const auteur = recipe.isMine ? null : displayNameFor(recipe.owner, userId);
  return (
    <li>
      <Link to={`/recettes/${recipe.id}`} className="block h-full">
        <Etiquette
          titre={recipe.title}
          detail={detailEtiquette(recipe, auteur)}
          nutrition={recipe.nutrition}
          photoUrl={recipe.photoUrl}
        />
      </Link>
    </li>
  );
}
