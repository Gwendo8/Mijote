import { useState } from 'react';
import { CalendarPlus } from 'lucide-react';
import { Link } from 'react-router';
import { useAddEntry, useVisibleSlots } from '../../hooks/planning/usePlanning.js';
import { jourComplet, today } from '../../utils/planning.js';
import SelecteurParts from '../recipes/SelecteurParts.jsx';
import Bouton from '../ui/Bouton.jsx';
import Champ from '../ui/Champ.jsx';
import Confirmation from '../ui/Confirmation.jsx';
import Fenetre from '../ui/Fenetre.jsx';
import MessageErreur from '../ui/MessageErreur.jsx';
import ChoixCreneau from './ChoixCreneau.jsx';
import ProposerCopie from './ProposerCopie.jsx';

// Bouton « Mettre au planning » d'une fiche (recette ou idée) : ouvre le choix du jour, du créneau et des parts.
export default function MettreAuPlanning({ recipe }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Bouton onClick={() => setOpen(true)} className="w-full">
        <CalendarPlus size={16} strokeWidth={1.8} aria-hidden="true" />
        Mettre au planning
      </Bouton>
      {open && <FenetreMettreAuPlanning recipe={recipe} onClose={() => setOpen(false)} />}
    </>
  );
}

function FenetreMettreAuPlanning({ recipe, onClose }) {
  const { slots, loading, error } = useVisibleSlots();
  const [date, setDate] = useState(today);
  const [slotChoisi, setSlotChoisi] = useState(null);
  const [servings, setServings] = useState(1);
  const [step, setStep] = useState({ name: 'form' });
  const add = useAddEntry();

  const slot = slotChoisi ?? slots[0]?.id;

  async function submit(event) {
    event.preventDefault();
    const result = await add.run({ date, slotId: slot, recipeId: recipe.id, servings });
    if (!result.ok) return;
    setStep(recipe.isMine ? { name: 'fait' } : { name: 'copie', entryId: result.data.id });
  }

  if (step.name === 'copie') {
    return (
      <Fenetre titre="Ajouté au planning" onClose={onClose}>
        <ProposerCopie
          recipe={recipe}
          entryId={step.entryId}
          onDone={(message) => setStep({ name: 'fait', message })}
        />
      </Fenetre>
    );
  }

  if (step.name === 'fait') {
    return (
      <Fenetre titre="Au planning" onClose={onClose}>
        <Confirmation>
          {step.message || `« ${recipe.title} » est au planning, ${jourComplet(date)}.`}
        </Confirmation>
        <div className="mt-4 flex flex-col gap-3">
          <Bouton as={Link} to={`/planning?j=${date}`}>
            Voir le planning
          </Bouton>
          <Bouton type="contour" onClick={onClose}>
            Fermer
          </Bouton>
        </div>
      </Fenetre>
    );
  }

  return (
    <Fenetre titre="Mettre au planning" onClose={onClose}>
      <form onSubmit={submit} noValidate className="space-y-4">
        <p className="text-ui font-extrabold">{recipe.title}</p>
        <Champ
          label="Jour"
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
          error={add.fieldErrors?.date}
        />
        <div>
          <p className="mb-1 text-libelle font-extrabold uppercase">Créneau</p>
          {loading && <p className="font-text text-ui text-encre-2">Chargement des créneaux…</p>}
          <MessageErreur>{error}</MessageErreur>
          {slots.length > 0 && <ChoixCreneau slots={slots} value={slot} onChange={setSlotChoisi} />}
        </div>
        <SelecteurParts value={servings} onChange={setServings} min={0.5} pas={0.5} />
        <MessageErreur>{add.error}</MessageErreur>
        <Bouton
          htmlType="submit"
          className="w-full"
          pending={add.pending}
          pendingLabel="Ajout…"
          disabled={!slot || !date}
        >
          Mettre au planning
        </Bouton>
      </form>
    </Fenetre>
  );
}
