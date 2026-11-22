import { useState } from 'react';
import { Plus, Share2, SlidersHorizontal } from 'lucide-react';
import { useSearchParams } from 'react-router';
import BarreJours from '../../components/planning/BarreJours.jsx';
import FenetreAjoutPlat from '../../components/planning/FenetreAjoutPlat.jsx';
import FenetreModifierPlat from '../../components/planning/FenetreModifierPlat.jsx';
import ListeJoursPc from '../../components/planning/ListeJoursPc.jsx';
import NavigationSemaine from '../../components/planning/NavigationSemaine.jsx';
import ResumeSemaine from '../../components/planning/ResumeSemaine.jsx';
import TicketJour from '../../components/planning/TicketJour.jsx';
import EnTetePage from '../../components/layout/EnTetePage.jsx';
import Bouton from '../../components/ui/Bouton.jsx';
import Chargement from '../../components/ui/Chargement.jsx';
import Confirmation from '../../components/ui/Confirmation.jsx';
import MessageErreur from '../../components/ui/MessageErreur.jsx';
import { useSession } from '../../hooks/auth/useSession.js';
import { useIsDesktop } from '../../hooks/layout/useIsDesktop.js';
import { usePlanningWeek } from '../../hooks/planning/usePlanning.js';
import { addDays, mondayOf, parseIso, toIso, today } from '../../utils/planning.js';

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const bouton =
  'flex size-10 shrink-0 items-center justify-center rounded-coin border-[1.5px] border-encre bg-comptoir disabled:cursor-not-allowed disabled:opacity-50';

// Une adresse `?j=2026-11-19` : le jour choisi ; sans elle (ou si elle est fausse), aujourd'hui.
function dayFrom(params) {
  const j = params.get('j');
  return j && ISO.test(j) && toIso(parseIso(j)) === j ? j : today();
}

// Planning de la semaine. Téléphone : barre des 7 jours puis le ticket du jour. PC (version A) : mini-tickets des
// jours à gauche, ticket du jour au centre, actions et résumé de la semaine à droite.
// Partager et régler les créneaux arrivent avec le bloc suivant : leurs boutons sont déjà là, éteints.
export default function PlanningPage() {
  const { user } = useSession();
  const isDesktop = useIsDesktop();
  const [params, setParams] = useSearchParams();
  const date = dayFrom(params);
  const monday = mondayOf(date);
  const { week, loading, error, reload } = usePlanningWeek(monday);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(null);
  const [notice, setNotice] = useState('');

  const select = (iso) => setParams({ j: iso }, { replace: true });
  const move = (weeks) => select(addDays(date, weeks * 7));
  const day = week?.days.find((d) => d.date === date);
  const slots = week?.slots ?? [];
  // Créneau proposé : le premier qui n'a encore rien ce jour-là
  const libre = slots.find((s) => !day?.entries.some((e) => e.slotId === s.id)) ?? slots[0];

  const closeWindow = (message) => {
    setAdding(false);
    setEditing(null);
    setNotice(message || '');
  };

  const boutonAjout = (type) => (
    <Bouton
      type={type}
      onClick={() => setAdding(true)}
      disabled={!week || slots.length === 0}
      className="w-full"
    >
      <Plus size={16} strokeWidth={1.8} aria-hidden="true" />
      Ajouter une ligne
    </Bouton>
  );

  return (
    <div>
      <EnTetePage titre="Planning">
        {isDesktop && <NavigationSemaine monday={monday} onMove={move} />}
        <button
          type="button"
          disabled
          aria-label="Partager le planning (bientôt)"
          className={bouton}
        >
          <Share2 size={18} strokeWidth={1.8} aria-hidden="true" />
        </button>
        <button
          type="button"
          disabled
          aria-label="Régler les créneaux (bientôt)"
          className={bouton}
        >
          <SlidersHorizontal size={18} strokeWidth={1.8} aria-hidden="true" />
        </button>
      </EnTetePage>

      {!isDesktop && (
        <div className="mb-3">
          <NavigationSemaine monday={monday} onMove={move} />
        </div>
      )}

      {notice && (
        <div className="mb-4">
          <Confirmation>{notice}</Confirmation>
        </div>
      )}
      {loading && <Chargement label="Chargement du planning…" />}
      {error && (
        <div className="space-y-3">
          <MessageErreur>{error}</MessageErreur>
          <Bouton type="contour" onClick={reload}>
            Réessayer
          </Bouton>
        </div>
      )}

      {week && day && !isDesktop && (
        <div>
          <BarreJours days={week.days.map((d) => d.date)} selected={date} onSelect={select} />
          <TicketJour key={date} day={day} slots={slots} onOpenEntry={setEditing} />
          <div className="mt-4 space-y-4">
            {boutonAjout('contour')}
            <ResumeSemaine week={week} />
          </div>
        </div>
      )}

      {week && day && isDesktop && (
        <div className="grid grid-cols-[200px_minmax(0,520px)_minmax(0,260px)] items-start gap-x-8 xl:gap-x-22">
          <ListeJoursPc days={week.days} selected={date} onSelect={select} />
          <TicketJour key={date} day={day} slots={slots} onOpenEntry={setEditing} />
          <div className="space-y-3">
            {boutonAjout('principal')}
            <ResumeSemaine week={week} />
          </div>
        </div>
      )}

      {week && slots.length === 0 && (
        <p className="mt-3 font-text text-ui text-encre-2">
          Aucun créneau n’est visible : il faut en afficher un pour ajouter un plat.
        </p>
      )}

      {adding && week && (
        <FenetreAjoutPlat
          date={date}
          slots={slots}
          slotId={libre?.id}
          userId={user?.id}
          onAdded={reload}
          onClose={closeWindow}
        />
      )}
      {editing && week && (
        <FenetreModifierPlat entry={editing} slots={slots} onSaved={reload} onClose={closeWindow} />
      )}
    </div>
  );
}
