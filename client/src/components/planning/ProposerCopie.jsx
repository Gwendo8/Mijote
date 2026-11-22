import { Copy } from 'lucide-react';
import { useCopyRecipe } from '../../hooks/recipes/useRecipeActions.js';
import { fullName } from '../../utils/names.js';
import Bouton from '../ui/Bouton.jsx';
import Confirmation from '../ui/Confirmation.jsx';
import MessageErreur from '../ui/MessageErreur.jsx';

// Après avoir placé la recette d'une autre personne : « Copier chez moi pour la garder ? ».
// Rien n'est copié sans accord. La copie est privée ; la ligne du planning garde la recette d'origine et
// ses dernières calories connues (elle ne bascule pas sur la copie).
export default function ProposerCopie({ recipe, onDone }) {
  const copy = useCopyRecipe(recipe.id);

  async function copier() {
    const result = await copy.run();
    if (result.ok)
      onDone(`« ${recipe.title} » est copiée chez toi. Elle est privée : toi seul la vois.`);
  }

  return (
    <div>
      <Confirmation>Ajoutée au planning.</Confirmation>
      <p className="mt-4 font-text text-lecture leading-[1.55]">
        « {recipe.title} » est {recipe.kind === 'idea' ? 'l’idée' : 'la recette'} de{' '}
        {fullName(recipe.owner)}. Si elle la retire ou la supprime, tu ne pourras plus l’ouvrir (le
        planning garde son titre et ses dernières calories connues). Copier chez moi pour la garder
        ?
      </p>
      <div className="mt-4">
        <MessageErreur>{copy.error}</MessageErreur>
      </div>
      <div className="mt-4 flex flex-col gap-3">
        <Bouton onClick={copier} pending={copy.pending} pendingLabel="Copie…">
          <Copy size={16} strokeWidth={1.8} aria-hidden="true" />
          Copier chez moi
        </Bouton>
        <Bouton type="contour" onClick={() => onDone('')}>
          Non merci
        </Bouton>
      </div>
    </div>
  );
}
