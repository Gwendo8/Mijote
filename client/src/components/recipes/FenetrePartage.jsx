import { useState } from 'react';
import { useSession } from '../../hooks/auth/useSession.js';
import { useShareRecipe } from '../../hooks/recipes/useRecipeActions.js';
import Bouton from '../ui/Bouton.jsx';
import Fenetre from '../ui/Fenetre.jsx';
import MessageErreur from '../ui/MessageErreur.jsx';
import { TicketTirets } from '../ui/Ticket.jsx';
import ChoixVisibilite from './ChoixVisibilite.jsx';

// Fenêtre « Qui peut la voir ? » : change la visibilité d'une recette et les personnes choisies.
// `onDone(recipe)` reçoit la recette enregistrée.
export default function FenetrePartage({ recipe, onClose, onDone }) {
  const { user } = useSession();
  const [value, setValue] = useState({
    visibility: recipe.visibility,
    people: recipe.sharedWith ?? [],
  });
  const share = useShareRecipe(recipe);

  async function submit(event) {
    event.preventDefault();
    const result = await share.run(
      value.visibility,
      value.visibility === 'shared' ? value.people.map((person) => person.id) : [],
    );
    if (result.ok) onDone(result.data);
  }

  return (
    <Fenetre titre="Qui peut la voir ?" onClose={onClose}>
      <form onSubmit={submit} noValidate>
        <p className="-mt-2 mb-3 text-libelle text-encre-2 [overflow-wrap:anywhere]">
          {recipe.title}
        </p>
        <TicketTirets />
        <ChoixVisibilite
          value={value}
          onChange={setValue}
          userId={user?.id}
          error={share.fieldErrors.sharedWith}
          legendeCachee
        />
        <TicketTirets />
        <p className="mb-4 font-text text-ui text-encre-2">
          Les autres peuvent voir la recette et la copier chez eux, sans pouvoir la modifier.
        </p>
        <div className="mb-3">
          <MessageErreur>
            {share.error && !share.fieldErrors.sharedWith ? share.error : null}
          </MessageErreur>
        </div>
        <div className="flex flex-col gap-3 lg:flex-row-reverse">
          <Bouton htmlType="submit" pending={share.pending} pendingLabel="Enregistrement…">
            Enregistrer le partage
          </Bouton>
          <Bouton type="contour" onClick={onClose}>
            Annuler
          </Bouton>
        </div>
      </form>
    </Fenetre>
  );
}
