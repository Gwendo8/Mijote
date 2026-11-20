import { useState } from 'react';
import { Pencil, ShieldCheck } from 'lucide-react';
import { Link, useLocation, useParams } from 'react-router';
import CalculPortion from '../../components/foods/CalculPortion.jsx';
import FenetreCorrection from '../../components/foods/FenetreCorrection.jsx';
import FicheValeurs from '../../components/foods/FicheValeurs.jsx';
import NoteCorrection from '../../components/foods/NoteCorrection.jsx';
import BoutonRetour from '../../components/layout/BoutonRetour.jsx';
import Bouton from '../../components/ui/Bouton.jsx';
import Chargement from '../../components/ui/Chargement.jsx';
import Confirmation from '../../components/ui/Confirmation.jsx';
import MessageErreur from '../../components/ui/MessageErreur.jsx';
import Ticket, { TicketTirets } from '../../components/ui/Ticket.jsx';
import { useSession } from '../../hooks/auth/useSession.js';
import { useFood } from '../../hooks/foods/useFood.js';
import { useIsDesktop } from '../../hooks/layout/useIsDesktop.js';
import { sourceLabel } from '../../utils/foods.js';

// Fiche d'un aliment : valeurs pour 100 g, calcul d'une portion, et la valeur d'origine si l'admin l'a corrigé.
// Téléphone : un seul ticket ; PC : le ticket des valeurs à gauche, la portion et la note à droite.
export default function AlimentPage() {
  const { id } = useParams();
  const isDesktop = useIsDesktop();
  const location = useLocation();
  const { user } = useSession();
  const { food, loading, error, reload } = useFood(id);
  const [correcting, setCorrecting] = useState(false);
  const [notice, setNotice] = useState(location.state?.notice ?? '');

  const canCorrect = user?.role === 'admin' && food && food.source !== 'user';
  const canEdit = food?.isMine;

  function corrected(message) {
    setCorrecting(false);
    setNotice(message);
    reload();
  }

  const actions = food && (canEdit || canCorrect) && (
    <div className="flex flex-wrap gap-3">
      {canEdit && (
        <Bouton as={Link} to={`/aliments/${food.id}/modifier`} type="contour">
          <Pencil size={16} strokeWidth={1.8} aria-hidden="true" />
          Modifier
        </Bouton>
      )}
      {canCorrect && (
        <Bouton type="contour" onClick={() => setCorrecting(true)}>
          <ShieldCheck size={16} strokeWidth={1.8} aria-hidden="true" />
          Corriger
        </Bouton>
      )}
    </div>
  );

  return (
    <div>
      <div className="mb-3 lg:mb-5">
        <BoutonRetour to="/aliments" libelle="Aliments" />
      </div>
      {notice && (
        <div className="mb-4">
          <Confirmation>{notice}</Confirmation>
        </div>
      )}
      {loading && <Chargement label="Chargement de l’aliment…" />}
      {error && <MessageErreur>{error}</MessageErreur>}
      {food && !isDesktop && (
        <div className="space-y-4">
          <Ticket>
            <FicheValeurs food={food} />
            <TicketTirets />
            <CalculPortion food={food} />
            {food.isCorrected && (
              <>
                <TicketTirets />
                <NoteCorrection food={food} />
              </>
            )}
          </Ticket>
          {actions}
        </div>
      )}
      {food && isDesktop && (
        <div className="grid w-fit grid-cols-[460px_360px] items-start gap-7">
          <Ticket aere>
            <FicheValeurs food={food} />
          </Ticket>
          <div className="space-y-3">
            <Ticket aere>
              <CalculPortion food={food} />
            </Ticket>
            {food.isCorrected && <NoteCorrection food={food} carte />}
            {actions}
            <p className="text-mention text-encre-2">
              Données : {sourceLabel(food.source)}
              {food.source === 'ciqual' ? ' (ANSES)' : ''}.
            </p>
          </div>
        </div>
      )}
      {correcting && (
        <FenetreCorrection food={food} onClose={() => setCorrecting(false)} onDone={corrected} />
      )}
    </div>
  );
}
