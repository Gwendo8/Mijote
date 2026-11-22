import { useState } from 'react';
import { Share2 } from 'lucide-react';
import { useDeleteShare } from '../../hooks/planning/usePlanning.js';
import { displayNameFor } from '../../utils/names.js';
import { formatSemaine } from '../../utils/planning.js';
import Bouton from '../ui/Bouton.jsx';
import Chargement from '../ui/Chargement.jsx';
import MessageErreur from '../ui/MessageErreur.jsx';
import Ticket, { TicketEntete, TicketTirets } from '../ui/Ticket.jsx';
import FenetrePartagePlanning from './FenetrePartagePlanning.jsx';

// Le ticket « Qui voit mon planning » : mes partages (lecture seule), à retirer, et le bouton pour en ajouter.
export default function PartagesReglages({ shares, loading, error, reload, userId }) {
  const [open, setOpen] = useState(false);
  const del = useDeleteShare();

  async function retirer(share) {
    const result = await del.run(share.id);
    if (result.ok) reload();
  }

  return (
    <Ticket>
      <TicketEntete titre="Qui voit mon planning" as="h2" sousTitre="en lecture seule" />
      <TicketTirets />
      {loading && <Chargement label="Chargement des partages…" />}
      <MessageErreur>{error}</MessageErreur>
      <MessageErreur>{del.error}</MessageErreur>
      {!loading && !error && shares.length === 0 && (
        <p className="py-2 font-text text-lecture text-encre-2">
          Personne ne voit ton planning pour l’instant.
        </p>
      )}
      <ul className="divide-y-2 divide-dotted divide-pointilles">
        {shares.map((share) => {
          const qui = share.user ? displayNameFor(share.user, userId) : 'Tout le monde';
          const quoi = share.weekStart
            ? `semaine du ${formatSemaine(share.weekStart)}`
            : 'tout le planning';
          return (
            <li key={share.id} className="flex items-center gap-3 py-2">
              <div className="min-w-0 flex-1">
                <p className="font-extrabold [overflow-wrap:anywhere]">{qui}</p>
                <p className="text-mention text-encre-2">{quoi}</p>
              </div>
              <Bouton
                type="contour"
                className="min-h-9! px-3"
                disabled={del.pending}
                onClick={() => retirer(share)}
                aria-label={`Retirer le partage : ${qui}, ${quoi}`}
              >
                Retirer
              </Bouton>
            </li>
          );
        })}
      </ul>
      <TicketTirets />
      <Bouton type="noir" className="w-full" onClick={() => setOpen(true)}>
        <Share2 size={16} strokeWidth={1.8} aria-hidden="true" />
        Partager mon planning
      </Bouton>
      {open && (
        <FenetrePartagePlanning userId={userId} onDone={reload} onClose={() => setOpen(false)} />
      )}
    </Ticket>
  );
}
