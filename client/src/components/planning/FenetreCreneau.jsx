import { useState } from 'react';
import { useCreateSlot, useUpdateSlot } from '../../hooks/planning/usePlanning.js';
import Bouton from '../ui/Bouton.jsx';
import Champ from '../ui/Champ.jsx';
import Fenetre from '../ui/Fenetre.jsx';
import MessageErreur from '../ui/MessageErreur.jsx';

// Ajouter un créneau (sans `slot`) ou renommer un créneau (avec `slot`). `onDone` : enregistré, la page recharge.
export default function FenetreCreneau({ slot, onDone, onClose }) {
  const [name, setName] = useState(slot?.name ?? '');
  const [invalid, setInvalid] = useState('');
  const create = useCreateSlot();
  const update = useUpdateSlot();
  const action = slot ? update : create;

  async function submit(event) {
    event.preventDefault();
    const clean = name.trim();
    if (!clean) return setInvalid('Le nom du créneau est obligatoire');
    if (clean.length > 50)
      return setInvalid('Le nom du créneau ne peut pas dépasser 50 caractères');
    setInvalid('');
    const result = slot ? await update.run(slot.id, { name: clean }) : await create.run(clean);
    if (result.ok) onDone();
  }

  return (
    <Fenetre titre={slot ? 'Renommer le créneau' : 'Ajouter un créneau'} onClose={onClose}>
      <form onSubmit={submit} noValidate className="space-y-4">
        <Champ
          label="Nom"
          value={name}
          onChange={(event) => setName(event.target.value)}
          error={invalid || action.fieldErrors.name}
          maxLength={50}
          placeholder="Avant le sport…"
        />
        <MessageErreur>
          {action.error && !action.fieldErrors.name ? action.error : null}
        </MessageErreur>
        <div className="flex flex-col gap-3 lg:flex-row-reverse">
          <Bouton htmlType="submit" pending={action.pending} pendingLabel="Enregistrement…">
            {slot ? 'Renommer' : 'Ajouter'}
          </Bouton>
          <Bouton type="contour" onClick={onClose}>
            Annuler
          </Bouton>
        </div>
      </form>
    </Fenetre>
  );
}
