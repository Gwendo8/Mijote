import { useDeleteSlot } from '../../hooks/planning/usePlanning.js';
import DialogueConfirmation from '../ui/DialogueConfirmation.jsx';

// Confirmation avant de supprimer un créneau ajouté : ses plats (toutes les semaines) partent avec lui.
// L'API ne dit pas combien de plats il contient : on ne donne donc pas de nombre (rien d'inventé).
export default function SupprimerCreneau({ slot, onDone, onClose }) {
  const del = useDeleteSlot();

  async function confirm() {
    const result = await del.run(slot.id);
    if (result.ok) onDone();
  }

  return (
    <DialogueConfirmation
      titre={`Supprimer « ${slot.name} » ?`}
      message="Tous les plats prévus dans ce créneau, dans toutes les semaines, seront supprimés aussi. Cela ne peut pas être annulé."
      confirmLabel="Supprimer le créneau et ses plats"
      pending={del.pending}
      error={del.error}
      onConfirm={confirm}
      onCancel={onClose}
    />
  );
}
