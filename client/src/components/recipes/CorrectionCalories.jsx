import { useRevertManual } from '../../hooks/recipes/useRecipeActions.js';
import { formatNombre } from '../../utils/foods.js';
import { nutritionView } from '../../utils/recipes.js';
import Bouton from '../ui/Bouton.jsx';
import MessageErreur from '../ui/MessageErreur.jsx';

// Carte « Correction » d'une idée dont les calories ont été corrigées à la main : rappelle l'écart avec le calcul
// et permet d'y revenir. Rien n'est affiché si la correction n'existe pas, ou si l'idée n'est pas à moi.
// `onChanged(message)` : prévenu après le retour au calcul, pour recharger la fiche.
export default function CorrectionCalories({ recipe, onChanged }) {
  const revert = useRevertManual(recipe);
  const vue = nutritionView(recipe.nutrition);
  if (!recipe.isMine || !vue.manual) return null;
  const calcul = recipe.nutrition?.perServing?.calories;
  const complet = vue.complete && calcul !== undefined;

  async function revenir() {
    const result = await revert.run();
    if (result.ok) onChanged?.('Les calories sont revenues au calcul.');
  }

  return (
    <aside aria-labelledby="titre-correction" className="space-y-3">
      <div className="bg-surface p-3.5 font-text text-ui">
        <h2 id="titre-correction" className="mb-1 font-heading text-mention font-extrabold">
          Correction
        </h2>
        <p>
          Les calories ont été corrigées à la main : {formatNombre(vue.kcal, 0)}
          {complet
            ? ` au lieu de ${formatNombre(calcul, 0)} calculées`
            : ' (le calcul est à compléter)'}
          . Tu peux revenir au calcul à tout moment.
        </p>
      </div>
      <Bouton
        type="contour"
        className="w-full"
        onClick={revenir}
        pending={revert.pending}
        pendingLabel="Retour au calcul…"
      >
        Revenir au calcul
      </Bouton>
      <MessageErreur>{revert.error}</MessageErreur>
    </aside>
  );
}
