import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useDeleteRecipe } from '../../hooks/recipes/useRecipeActions.js';
import Bouton from '../ui/Bouton.jsx';
import DialogueConfirmation from '../ui/DialogueConfirmation.jsx';

// « Supprimer la recette » avec confirmation. Suppression réelle (pas de corbeille) : le dialogue le dit.
export default function SupprimerRecette({ recipe }) {
  const navigate = useNavigate();
  const [asking, setAsking] = useState(false);
  const remove = useDeleteRecipe(recipe.id);
  const idee = recipe.kind === 'idea';

  async function confirm() {
    const result = await remove.run();
    if (result.ok) {
      navigate(idee ? '/idees' : '/recettes', {
        replace: true,
        state: { notice: `« ${recipe.title} » est supprimée.` },
      });
    }
  }

  return (
    <>
      <Bouton type="contour" onClick={() => setAsking(true)}>
        <Trash2 size={16} strokeWidth={1.8} aria-hidden="true" />
        Supprimer la {idee ? 'idée' : 'recette'}
      </Bouton>
      {asking && (
        <DialogueConfirmation
          titre={`Supprimer la ${idee ? 'idée' : 'recette'} ?`}
          message={`« ${recipe.title} » sera supprimée pour de bon, avec sa photo. Les copies faites par d’autres personnes restent. Dans le planning, les cases qui l’utilisaient gardent son titre en texte libre.`}
          confirmLabel={`Supprimer « ${recipe.title} »`}
          pending={remove.pending}
          error={remove.error}
          onConfirm={confirm}
          onCancel={() => setAsking(false)}
        />
      )}
    </>
  );
}
