import { useState } from 'react';
import { Copy, Pencil, Share2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { useCopyRecipe } from '../../hooks/recipes/useRecipeActions.js';
import { basePath } from '../../utils/recipes.js';
import Bouton from '../ui/Bouton.jsx';
import MessageErreur from '../ui/MessageErreur.jsx';
import FenetrePartage from './FenetrePartage.jsx';

const iconeBouton =
  'flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-coin border-[1.5px] border-encre bg-comptoir';

// Les actions d'une fiche selon les droits : la mienne → Partager et Modifier ; celle d'une autre personne → « Copier chez moi ».
// `icones` : de simples icônes de 40 px (téléphone) ; sinon des boutons avec leur texte (PC).
// `onChanged(message)` : prévenu après un partage, pour recharger la fiche.
export default function BarreActionsRecette({ recipe, icones = false, onChanged }) {
  const navigate = useNavigate();
  const [sharing, setSharing] = useState(false);
  const copy = useCopyRecipe(recipe.id);

  async function copier() {
    const result = await copy.run();
    if (result.ok) {
      navigate(`${basePath(recipe.kind)}/${result.data.id}`, {
        state: {
          notice: `${recipe.kind === 'idea' ? 'Idée copiée' : 'Recette copiée'} chez toi. Elle est privée : toi seul la vois.`,
        },
      });
    }
  }

  if (!recipe.isMine) {
    return (
      <div className="space-y-2">
        <Bouton type="contour" onClick={copier} pending={copy.pending} pendingLabel="Copie…">
          <Copy size={16} strokeWidth={1.8} aria-hidden="true" />
          Copier chez moi
        </Bouton>
        <MessageErreur>{copy.error}</MessageErreur>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-2">
        {icones ? (
          <>
            <button
              type="button"
              onClick={() => setSharing(true)}
              aria-label="Partager"
              className={iconeBouton}
            >
              <Share2 size={18} strokeWidth={1.8} aria-hidden="true" />
            </button>
            <Link
              to={`${basePath(recipe.kind)}/${recipe.id}/modifier`}
              aria-label="Modifier"
              className={iconeBouton}
            >
              <Pencil size={18} strokeWidth={1.8} aria-hidden="true" />
            </Link>
          </>
        ) : (
          <>
            <Bouton type="contour" onClick={() => setSharing(true)}>
              <Share2 size={16} strokeWidth={1.8} aria-hidden="true" />
              Partager
            </Bouton>
            <Bouton as={Link} to={`${basePath(recipe.kind)}/${recipe.id}/modifier`} type="contour">
              <Pencil size={16} strokeWidth={1.8} aria-hidden="true" />
              Modifier
            </Bouton>
          </>
        )}
      </div>
      {sharing && (
        <FenetrePartage
          recipe={recipe}
          onClose={() => setSharing(false)}
          onDone={() => {
            setSharing(false);
            onChanged?.('Partage enregistré.');
          }}
        />
      )}
    </>
  );
}
