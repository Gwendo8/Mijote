import { useState } from 'react';
import { useAddEntry } from '../../hooks/planning/usePlanning.js';
import { freeEntrySchema } from '../../schemas/planning.js';
import { parseDecimal } from '../../utils/foods.js';
import { jourComplet } from '../../utils/planning.js';
import { validate } from '../../utils/validate.js';
import SelecteurParts from '../recipes/SelecteurParts.jsx';
import Bouton from '../ui/Bouton.jsx';
import Champ from '../ui/Champ.jsx';
import Fenetre from '../ui/Fenetre.jsx';
import MessageErreur from '../ui/MessageErreur.jsx';
import Puce from '../ui/Puce.jsx';
import ChoixCreneau from './ChoixCreneau.jsx';
import ChoixPlat from './ChoixPlat.jsx';
import ProposerCopie from './ProposerCopie.jsx';

const ONGLETS = [
  { id: 'recipe', libelle: 'Recettes' },
  { id: 'idea', libelle: 'Idées' },
  { id: 'libre', libelle: 'Texte libre' },
];

// « Ajouter une ligne » : un plat dans un créneau d'un jour : une recette, une idée de plat ou un texte libre.
// `slotId` : créneau proposé au départ. `onAdded` : la ligne est enregistrée (la page recharge la semaine).
// `onClose(message)` ferme la fenêtre ; `message` (peut être vide) est une confirmation à montrer sur la page.
export default function FenetreAjoutPlat({ date, slots, slotId, userId, onAdded, onClose }) {
  const [slot, setSlot] = useState(slotId ?? slots[0]?.id);
  const [mode, setMode] = useState('recipe');
  const [choisi, setChoisi] = useState(null);
  const [servings, setServings] = useState(1);
  const [label, setLabel] = useState('');
  const [calories, setCalories] = useState('');
  const [errors, setErrors] = useState({});
  const [aCopier, setACopier] = useState(null);
  const add = useAddEntry();

  const nomCreneau = slots.find((s) => s.id === slot)?.name ?? '';
  const libre = mode === 'libre';
  const pret = libre ? label.trim() !== '' : Boolean(choisi);

  function changerOnglet(id) {
    setMode(id);
    setChoisi(null);
    setErrors({});
  }

  async function submit(event) {
    event.preventDefault();
    let body;
    if (libre) {
      const checked = validate(freeEntrySchema, {
        label,
        caloriesManual: parseDecimal(calories),
      });
      if (calories.trim() !== '' && parseDecimal(calories) === null) {
        setErrors({ caloriesManual: 'Les calories sont invalides' });
        return;
      }
      if (checked.errors) {
        setErrors(checked.errors);
        return;
      }
      body = { date, slotId: slot, label: checked.data.label };
      if (checked.data.caloriesManual !== null) body.caloriesManual = checked.data.caloriesManual;
    } else {
      body = { date, slotId: slot, recipeId: choisi.id, servings };
    }
    setErrors({});
    const result = await add.run(body);
    if (!result.ok) return;
    onAdded();
    // La recette d'une autre personne : on propose d'en garder une copie
    if (!libre && !choisi.isMine) setACopier({ recipe: choisi, entryId: result.data.id });
    else onClose(`Ajouté : « ${libre ? body.label : choisi.title} », ${jourComplet(date)}.`);
  }

  if (aCopier) {
    return (
      <Fenetre titre="Ajouté au planning" onClose={() => onClose('')}>
        <ProposerCopie recipe={aCopier.recipe} entryId={aCopier.entryId} onDone={onClose} />
      </Fenetre>
    );
  }

  return (
    <Fenetre titre={`Ajouter au ${nomCreneau.toLowerCase()}`} onClose={() => onClose('')} large>
      <form onSubmit={submit} noValidate>
        <p className="mb-4 text-libelle text-encre-2">{jourComplet(date)}</p>
        <div className="mb-3">
          <ChoixCreneau slots={slots} value={slot} onChange={setSlot} />
        </div>
        <div role="group" aria-label="Type de plat" className="mb-3 grid grid-cols-3 gap-2">
          {ONGLETS.map((onglet) => (
            <Puce
              key={onglet.id}
              actif={mode === onglet.id}
              onClick={() => changerOnglet(onglet.id)}
            >
              {onglet.libelle}
            </Puce>
          ))}
        </div>

        {libre ? (
          <div className="space-y-3">
            <Champ
              label="Titre"
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              error={errors.label}
              maxLength={255}
              placeholder="Une pomme, un restau…"
            />
            <Champ
              label="Calories (facultatif)"
              inputMode="decimal"
              value={calories}
              onChange={(event) => setCalories(event.target.value)}
              error={errors.caloriesManual}
              help="Laisse vide si tu ne les connais pas : la ligne ne sera pas comptée dans le total."
            />
          </div>
        ) : (
          <ChoixPlat
            key={mode}
            kind={mode}
            selectedId={choisi?.id}
            onSelect={setChoisi}
            userId={userId}
          />
        )}

        <hr className="my-4 border-0 border-t-[1.5px] border-dashed border-encre" />
        {!libre && (
          <div className="mb-3">
            <SelecteurParts value={servings} onChange={setServings} min={0.5} pas={0.5} />
            {choisi && (
              <p className="mt-1 text-mention text-encre-2">
                {choisi.nutrition?.caloriesPerServing != null
                  ? `${Math.round(choisi.nutrition.caloriesPerServing * servings)} kcal${
                      choisi.nutrition.proteinsPerServing != null
                        ? `, ${Math.round(choisi.nutrition.proteinsPerServing * servings)} g de prot.`
                        : ''
                    }`
                  : 'Calories à compléter : cette ligne ne sera pas comptée dans le total.'}
              </p>
            )}
          </div>
        )}
        <div className="mb-3">
          <MessageErreur>{add.error}</MessageErreur>
        </div>
        <Bouton
          htmlType="submit"
          className="w-full"
          pending={add.pending}
          pendingLabel="Ajout…"
          disabled={!pret}
        >
          Ajouter au {nomCreneau.toLowerCase()}
        </Bouton>
      </form>
    </Fenetre>
  );
}
