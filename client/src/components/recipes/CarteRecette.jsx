import { Link } from 'react-router';
import Etiquette from '../ui/Etiquette.jsx';
import { detailEtiquette } from '../../utils/recipes.js';
import { displayNameFor } from '../../utils/names.js';

// Une recette dans la liste : l'étiquette de marché, qui est un lien vers la fiche.
// `onOpen` (PC) ouvre la fiche dans le panneau à droite au lieu de changer d'écran.
// `userId` sert à écrire « de Léa » sous les recettes des autres.
export default function CarteRecette({ recipe, userId, onOpen, selected = false }) {
  const auteur = recipe.isMine ? null : displayNameFor(recipe.owner, userId);
  return (
    <li>
      <Link
        to={`/recettes/${recipe.id}`}
        onClick={
          onOpen
            ? (event) => {
                if (event.metaKey || event.ctrlKey || event.shiftKey) return;
                event.preventDefault();
                onOpen(recipe.id);
              }
            : undefined
        }
        aria-current={selected ? 'true' : undefined}
        className={`block h-full ${selected ? 'outline-3 outline-offset-2 outline-vert' : ''}`}
      >
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
