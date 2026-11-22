import { useState } from 'react';
import { useLocation, useParams } from 'react-router';
import BoutonRetour from '../../components/layout/BoutonRetour.jsx';
import BarreActionsRecette from '../../components/recipes/BarreActionsRecette.jsx';
import CorrectionCalories from '../../components/recipes/CorrectionCalories.jsx';
import EtapesRecette from '../../components/recipes/EtapesRecette.jsx';
import FicheRecette from '../../components/recipes/FicheRecette.jsx';
import MettreAuPlanning from '../../components/planning/MettreAuPlanning.jsx';
import SupprimerRecette from '../../components/recipes/SupprimerRecette.jsx';
import Chargement from '../../components/ui/Chargement.jsx';
import CodeBarres from '../../components/ui/CodeBarres.jsx';
import Confirmation from '../../components/ui/Confirmation.jsx';
import MessageErreur from '../../components/ui/MessageErreur.jsx';
import Ticket, { TicketEntete, TicketLigne, TicketTirets } from '../../components/ui/Ticket.jsx';
import { useIsDesktop } from '../../hooks/layout/useIsDesktop.js';
import { useRecipe } from '../../hooks/recipes/useRecipe.js';
import { fullName } from '../../utils/names.js';
import { basePath, introuvable, siteOf, splitSteps, visibiliteLabel } from '../../utils/recipes.js';

// Fiche d'une recette en grand. Téléphone : un seul ticket (étapes comprises) ; PC : le ticket de la recette à gauche,
// celui des étapes à droite. Les actions dépendent des droits : la mienne → partager, modifier, supprimer ;
// celle d'une autre personne → « Copier chez moi ».
// `key={id}` : passer d'une recette à une autre (après « Copier chez moi ») repart d'un état neuf, avec son message.
export default function RecettePage({ kind = 'recipe' }) {
  const { id } = useParams();
  return <FicheEnGrand key={id} id={id} kind={kind} />;
}

function FicheEnGrand({ id, kind }) {
  const idee = kind === 'idea';
  const isDesktop = useIsDesktop();
  const location = useLocation();
  const charge = useRecipe(id);
  const { loading, reload } = charge;
  const mauvaisType = charge.recipe && charge.recipe.kind !== kind;
  const recipe = mauvaisType ? null : charge.recipe;
  const error = mauvaisType ? introuvable(kind) : charge.error;
  const [notice, setNotice] = useState(location.state?.notice ?? '');

  const changed = (message) => {
    setNotice(message);
    reload();
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3 lg:mb-5 lg:max-w-252">
        <BoutonRetour to={basePath(kind)} libelle={idee ? 'Idées de plats' : 'Recettes'} />
        {recipe && <BarreActionsRecette recipe={recipe} icones={!isDesktop} onChanged={changed} />}
      </div>
      {notice && (
        <div className="mb-4">
          <Confirmation>{notice}</Confirmation>
        </div>
      )}
      {loading && (
        <Chargement label={idee ? 'Chargement de l’idée…' : 'Chargement de la recette…'} />
      )}
      <MessageErreur>{error}</MessageErreur>
      {recipe && !isDesktop && (
        <div className="space-y-4">
          <FicheRecette key={recipe.id} recipe={recipe} avecEtapes={!idee} />
          <MettreAuPlanning recipe={recipe} />
          {idee && <CorrectionCalories recipe={recipe} onChanged={changed} />}
          {recipe.isMine && <SupprimerRecette recipe={recipe} />}
        </div>
      )}
      {recipe && isDesktop && idee && (
        <div className="space-y-4">
          <div className="grid grid-cols-[minmax(0,480px)_minmax(0,280px)] items-start gap-7">
            <div className="space-y-4">
              <FicheRecette key={recipe.id} recipe={recipe} />
              <MettreAuPlanning recipe={recipe} />
            </div>
            <CorrectionCalories recipe={recipe} onChanged={changed} />
          </div>
          {recipe.isMine && <SupprimerRecette recipe={recipe} />}
        </div>
      )}
      {recipe && isDesktop && !idee && (
        <div className="space-y-4">
          <div className="grid grid-cols-[minmax(0,420px)_minmax(0,560px)] items-start gap-7">
            <div className="space-y-4">
              <FicheRecette key={recipe.id} recipe={recipe} />
              <MettreAuPlanning recipe={recipe} />
            </div>
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
