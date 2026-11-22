import { useState } from 'react';
import { Copy } from 'lucide-react';
import { useUpdateEntry } from '../../hooks/planning/usePlanning.js';
import { useCopyRecipe } from '../../hooks/recipes/useRecipeActions.js';
import { fullName } from '../../utils/names.js';
import Bouton from '../ui/Bouton.jsx';
import Confirmation from '../ui/Confirmation.jsx';
import MessageErreur from '../ui/MessageErreur.jsx';

// Après avoir placé la recette d'une autre personne : « Copier chez moi pour la garder ? ».
// Rien n'est copié sans accord. La copie est privée. Si on accepte : copie de la recette
// (POST /recipes/:id/copy), puis la ligne du planning pointe vers la copie en gardant sa place
// (PATCH /planning/entries/:id avec `recipeId`). `entryId` : la ligne qui vient d'être ajoutée.
export default function ProposerCopie({ recipe, entryId, onDone }) {
  const copy = useCopyRecipe(recipe.id);
  const relier = useUpdateEntry(entryId);
  // Si la copie a réussi mais pas le changement de ligne, on garde son id : « Réessayer » ne recopie pas.
  const [copieId, setCopieId] = useState(null);

  async function copier() {
    let id = copieId;
    if (id === null) {
      const result = await copy.run();
      if (!result.ok) return;
      id = result.data.id;
      setCopieId(id);
    }
    const result = await relier.run({ recipeId: id });
    if (result.ok)
      onDone(
        `« ${recipe.title} » est copiée chez toi, et le planning utilise ta copie. Elle est privée : toi seul la vois.`,
      );
  }

  return (
    <div>
      <Confirmation>Ajoutée au planning.</Confirmation>
      <p className="mt-4 font-text text-lecture leading-[1.55]">
        « {recipe.title} » est {recipe.kind === 'idea' ? 'l’idée' : 'la recette'} de{' '}
        {fullName(recipe.owner)}. Si elle la retire ou la supprime, tu ne pourras plus l’ouvrir (le
        planning garde son titre et ses dernières calories connues). Copier chez moi pour la garder
        ? La ligne du planning passera alors sur ta copie, à la même place : ta version ne change
        plus, que l’original change ou non.
      </p>
      {copieId !== null && relier.error && (
        <p className="mt-4 font-text text-lecture leading-[1.55]">
          Ta copie existe bien, mais la ligne du planning n’a pas pu passer dessus : elle suit
          toujours l’original. Tu peux réessayer, ou la changer plus tard depuis la fiche.
        </p>
      )}
      <div className="mt-4">
        <MessageErreur>{copy.error ?? relier.error}</MessageErreur>
      </div>
      <div className="mt-4 flex flex-col gap-3">
        <Bouton onClick={copier} pending={copy.pending || relier.pending} pendingLabel="Copie…">
          <Copy size={16} strokeWidth={1.8} aria-hidden="true" />
          {copieId !== null ? 'Réessayer' : 'Copier chez moi'}
        </Bouton>
        <Bouton type="contour" onClick={() => onDone('')}>
          {copieId !== null ? 'Laisser sur l’original' : 'Non merci'}
        </Bouton>
      </div>
    </div>
  );
}
