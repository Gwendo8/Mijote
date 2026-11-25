import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useUpdateSlot } from '../../hooks/planning/usePlanning.js';
import Bouton from '../ui/Bouton.jsx';
import Chargement from '../ui/Chargement.jsx';
import MessageErreur from '../ui/MessageErreur.jsx';
import Ticket, { TicketEntete, TicketTirets } from '../ui/Ticket.jsx';
import CreneauReglage from './CreneauReglage.jsx';
import FenetreCreneau from './FenetreCreneau.jsx';
import SupprimerCreneau from './SupprimerCreneau.jsx';

// Le ticket « Mes créneaux » : masquer / réafficher, réordonner, renommer, ajouter, supprimer (les ajoutés).
// `slots` : tous les créneaux, masqués compris, par position. `reload` : relit la liste après chaque changement.
export default function CreneauxReglages({ slots, loading, error, reload }) {
  const update = useUpdateSlot();
  const [dialog, setDialog] = useState(null); // { type: 'add' | 'rename' | 'delete', slot? }

  async function change(slot, values) {
    const result = await update.run(slot.id, values);
    if (result.ok) reload();
  }

  const done = () => {
    setDialog(null);
    reload();
  };

  return (
    <Ticket>
      <TicketEntete titre="Mes créneaux" as="h2" sousTitre="masque ceux que tu n’utilises pas" />
      <TicketTirets />
      {loading && <Chargement label="Chargement des créneaux…" />}
      <MessageErreur>{error}</MessageErreur>
      <MessageErreur>{update.error}</MessageErreur>
      <ul className="divide-y-2 divide-dotted divide-tirets">
        {slots.map((slot, index) => (
          <CreneauReglage
            key={slot.id}
            slot={slot}
            premier={index === 0}
            dernier={index === slots.length - 1}
            busy={update.pending}
            onToggle={() => change(slot, { isHidden: !slot.isHidden })}
            onMove={(step) => change(slot, { position: index + step })}
            onRename={() => setDialog({ type: 'rename', slot })}
            onDelete={() => setDialog({ type: 'delete', slot })}
          />
        ))}
      </ul>
      <TicketTirets />
      <Bouton type="contour" className="w-full" onClick={() => setDialog({ type: 'add' })}>
        <Plus size={16} strokeWidth={1.8} aria-hidden="true" />
        Ajouter un créneau
      </Bouton>
      {dialog?.type === 'add' && <FenetreCreneau onDone={done} onClose={() => setDialog(null)} />}
      {dialog?.type === 'rename' && (
        <FenetreCreneau slot={dialog.slot} onDone={done} onClose={() => setDialog(null)} />
      )}
      {dialog?.type === 'delete' && (
        <SupprimerCreneau slot={dialog.slot} onDone={done} onClose={() => setDialog(null)} />
      )}
    </Ticket>
  );
}
