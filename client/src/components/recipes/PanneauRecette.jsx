import { useState } from 'react';
import { Link } from 'react-router';
import { Maximize2, X } from 'lucide-react';
import { useRecipe } from '../../hooks/recipes/useRecipe.js';
import Chargement from '../ui/Chargement.jsx';
import Confirmation from '../ui/Confirmation.jsx';
import MessageErreur from '../ui/MessageErreur.jsx';
import BarreActionsRecette from './BarreActionsRecette.jsx';
import FicheRecette from './FicheRecette.jsx';

// Le panneau de 380 px à droite de la liste, sur PC : la fiche-ticket de la recette choisie.
// Les étapes ne tiennent pas dedans : « Voir les étapes » ouvre la fiche en grand.
export default function PanneauRecette({ id, onClose }) {
  const { recipe, loading, error, reload } = useRecipe(id);
  const [notice, setNotice] = useState('');

  return (
    <aside
      aria-label="Fiche de la recette"
      className="sticky top-6 max-h-[calc(100vh-3rem)] w-95 shrink-0 space-y-3 self-start overflow-y-auto bg-pointilles p-4"
    >
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer la fiche"
          className="flex size-10 cursor-pointer items-center justify-center rounded-coin border-[1.5px] border-encre bg-comptoir"
        >
          <X size={18} strokeWidth={1.8} aria-hidden="true" />
        </button>
        {recipe && (
          <BarreActionsRecette recipe={recipe} icones onChanged={(m) => (setNotice(m), reload())} />
        )}
      </div>
      {notice && <Confirmation>{notice}</Confirmation>}
      {loading && <Chargement label="Chargement de la recette…" />}
      <MessageErreur>{error}</MessageErreur>
      {recipe && (
        <>
          <FicheRecette key={recipe.id} recipe={recipe} />
          <Link
            to={`/recettes/${recipe.id}`}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-coin border-[1.5px] border-encre bg-transparent px-5 font-heading text-ui font-extrabold hover:bg-papier"
          >
            <Maximize2 size={16} strokeWidth={1.8} aria-hidden="true" />
            Voir les étapes
          </Link>
        </>
      )}
    </aside>
  );
}
