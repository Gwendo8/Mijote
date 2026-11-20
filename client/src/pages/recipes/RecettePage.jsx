import { useState } from 'react';
import { useLocation, useParams } from 'react-router';
import BoutonRetour from '../../components/layout/BoutonRetour.jsx';
import BarreActionsRecette from '../../components/recipes/BarreActionsRecette.jsx';
import EtapesRecette from '../../components/recipes/EtapesRecette.jsx';
import FicheRecette from '../../components/recipes/FicheRecette.jsx';
import SupprimerRecette from '../../components/recipes/SupprimerRecette.jsx';
import Chargement from '../../components/ui/Chargement.jsx';
import CodeBarres from '../../components/ui/CodeBarres.jsx';
import Confirmation from '../../components/ui/Confirmation.jsx';
import MessageErreur from '../../components/ui/MessageErreur.jsx';
import Ticket, { TicketEntete, TicketLigne, TicketTirets } from '../../components/ui/Ticket.jsx';
import { useIsDesktop } from '../../hooks/layout/useIsDesktop.js';
import { useRecipe } from '../../hooks/recipes/useRecipe.js';
import { fullName } from '../../utils/names.js';
import { siteOf, splitSteps, visibiliteLabel } from '../../utils/recipes.js';

// Fiche d'une recette en grand. Téléphone : un seul ticket (étapes comprises) ; PC : le ticket de la recette à gauche,
// celui des étapes à droite. Les actions dépendent des droits : la mienne → partager, modifier, supprimer ;
// celle d'une autre personne → « Copier chez moi ».
// `key={id}` : passer d'une recette à une autre (après « Copier chez moi ») repart d'un état neuf, avec son message.
export default function RecettePage() {
  const { id } = useParams();
  return <FicheEnGrand key={id} id={id} />;
}

function FicheEnGrand({ id }) {
  const isDesktop = useIsDesktop();
  const location = useLocation();
  const { recipe, loading, error, reload } = useRecipe(id);
  const [notice, setNotice] = useState(location.state?.notice ?? '');

  const changed = (message) => {
    setNotice(message);
    reload();
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3 lg:mb-5 lg:max-w-252">
        <BoutonRetour to="/recettes" libelle="Recettes" />
        {recipe && <BarreActionsRecette recipe={recipe} icones={!isDesktop} onChanged={changed} />}
      </div>
      {notice && (
        <div className="mb-4">
          <Confirmation>{notice}</Confirmation>
        </div>
      )}
      {loading && <Chargement label="Chargement de la recette…" />}
      <MessageErreur>{error}</MessageErreur>
      {recipe && !isDesktop && (
        <div className="space-y-4">
          <FicheRecette key={recipe.id} recipe={recipe} avecEtapes />
          {recipe.isMine && <SupprimerRecette recipe={recipe} />}
        </div>
      )}
      {recipe && isDesktop && (
        <div className="space-y-4">
          <div className="grid grid-cols-[minmax(0,420px)_minmax(0,560px)] items-start gap-7">
            <FicheRecette key={recipe.id} recipe={recipe} />
            <TicketEtapes recipe={recipe} />
          </div>
          {recipe.isMine && <SupprimerRecette recipe={recipe} />}
        </div>
      )}
    </div>
  );
}

// PC : le ticket des étapes, avec la provenance de la recette et qui peut la voir.
function TicketEtapes({ recipe }) {
  const nombre = splitSteps(recipe.instructions).length;
  const source = recipe.sourceUrl ? (
    <a href={recipe.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline">
      {siteOf(recipe.sourceUrl)}
    </a>
  ) : recipe.copiedFrom ? (
    `copie de « ${recipe.copiedFrom.title} »`
  ) : recipe.isMine ? (
    'ma recette'
  ) : (
    `recette de ${fullName(recipe.owner)}`
  );
  return (
    <Ticket aere>
      <TicketEntete
        titre="Étapes"
        as="h2"
        sousTitre={`${nombre} ${nombre > 1 ? 'étapes' : 'étape'}`}
      />
      <TicketTirets />
      <EtapesRecette instructions={recipe.instructions} avecMention={false} />
      <TicketTirets />
      <TicketLigne nom="source" valeur={source} />
      {recipe.isMine && (
        <TicketLigne nom="visible par" valeur={visibiliteLabel(recipe.visibility)} />
      )}
      <CodeBarres />
    </Ticket>
  );
}
