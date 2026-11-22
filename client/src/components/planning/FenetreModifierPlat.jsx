import { useState } from 'react';
import { ExternalLink, Trash2 } from 'lucide-react';
import { Link } from 'react-router';
import { useDeleteEntry, useUpdateEntry } from '../../hooks/planning/usePlanning.js';
import { freeEntrySchema } from '../../schemas/planning.js';
import { parseDecimal } from '../../utils/foods.js';
import { basePath } from '../../utils/recipes.js';
import { formatNombre } from '../../utils/planning.js';
import { validate } from '../../utils/validate.js';
import SelecteurParts from '../recipes/SelecteurParts.jsx';
import Bouton from '../ui/Bouton.jsx';
import Champ from '../ui/Champ.jsx';
import DialogueConfirmation from '../ui/DialogueConfirmation.jsx';
import Fenetre from '../ui/Fenetre.jsx';
import MessageErreur from '../ui/MessageErreur.jsx';
import ChoixCreneau from './ChoixCreneau.jsx';

// Modifier une ligne du planning : parts (recette), titre et calories (texte libre), jour et créneau (déplacer), ou la retirer.
// `onSaved` : la page recharge la semaine ; `onClose(message)` ferme la fenêtre avec un message à montrer.
export default function FenetreModifierPlat({ entry, slots, onSaved, onClose }) {
  const libre = entry.recipeAvailable === null;
  const [date, setDate] = useState(entry.date);
  const [slot, setSlot] = useState(entry.slotId);
  const [servings, setServings] = useState(entry.servings ?? 1);
  const [label, setLabel] = useState(entry.label);
  const [calories, setCalories] = useState(
    entry.caloriesManual === null || entry.caloriesManual === undefined
      ? ''
      : String(entry.caloriesManual).replace('.', ','),
  );
  const [errors, setErrors] = useState({});
  const [asking, setAsking] = useState(false);
  const update = useUpdateEntry(entry.id);
  const remove = useDeleteEntry(entry.id);

  async function submit(event) {
    event.preventDefault();
    const body = { date, slotId: slot };
    if (libre) {
      if (calories.trim() !== '' && parseDecimal(calories) === null) {
        setErrors({ caloriesManual: 'Les calories sont invalides' });
        return;
      }
      const checked = validate(freeEntrySchema, { label, caloriesManual: parseDecimal(calories) });
      if (checked.errors) {
        setErrors(checked.errors);
        return;
      }
      body.label = checked.data.label;
      body.caloriesManual = checked.data.caloriesManual;
    } else {
      body.servings = servings;
    }
    setErrors({});
    if (!date) {
      setErrors({ date: 'Choisis un jour' });
      return;
    }
    const result = await update.run(body);
    if (result.ok) {
      onSaved();
      onClose('Modifications enregistrées.');
    }
  }

  async function retirer() {
    const result = await remove.run();
    if (result.ok) {
      onSaved();
      onClose(`« ${entry.label} » est retiré du planning.`);
    }
  }

  const fieldError = (name) => errors[name] ?? update.fieldErrors?.[name];

  return (
    <>
      <Fenetre titre="Modifier la ligne" onClose={() => onClose('')}>
        <form onSubmit={submit} noValidate>
          {libre ? (
            <div className="space-y-3">
              <Champ
                label="Titre"
                value={label}
                onChange={(event) => setLabel(event.target.value)}
                error={fieldError('label')}
                maxLength={255}
              />
              <Champ
                label="Calories (facultatif)"
                inputMode="decimal"
                value={calories}
                onChange={(event) => setCalories(event.target.value)}
                error={fieldError('caloriesManual')}
                help="Laisse vide si tu ne les connais pas : la ligne ne sera pas comptée dans le total."
              />
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-ui font-extrabold">{entry.label}</p>
              {entry.recipeAvailable === false && (
                <p className="font-text text-lecture leading-[1.55] text-encre-2">
                  Cette recette n’est plus disponible. Le planning garde ses dernières calories
                  connues
                  {entry.lastKnownKcalPerServing != null
                    ? ` (${formatNombre(entry.lastKnownKcalPerServing)} kcal par part)`
                    : ''}
                  .
                </p>
              )}
              {entry.recipe && (
                <Link
                  to={`${basePath(entry.recipe.kind)}/${entry.recipe.id}`}
                  className="inline-flex items-center gap-1.5 text-ui font-bold underline"
                >
                  <ExternalLink size={14} strokeWidth={1.8} aria-hidden="true" />
                  Ouvrir {entry.recipe.kind === 'idea' ? 'l’idée' : 'la recette'}
                </Link>
              )}
              <SelecteurParts value={servings} onChange={setServings} min={0.5} pas={0.5} />
            </div>
          )}

          <div className="mt-4 space-y-3">
            <Champ
              label="Jour"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              error={fieldError('date')}
            />
            <div>
              <p className="mb-1 text-libelle font-extrabold uppercase">Créneau</p>
              <ChoixCreneau slots={slots} value={slot} onChange={setSlot} />
            </div>
          </div>

          <div className="mt-4">
            <MessageErreur>{update.error}</MessageErreur>
          </div>
          <div className="mt-4 flex flex-col gap-3">
            <Bouton htmlType="submit" pending={update.pending} pendingLabel="Enregistrement…">
              Enregistrer
            </Bouton>
            <Bouton type="contour" onClick={() => setAsking(true)}>
              <Trash2 size={16} strokeWidth={1.8} aria-hidden="true" />
              Retirer du planning
            </Bouton>
          </div>
        </form>
      </Fenetre>
      {asking && (
        <DialogueConfirmation
          titre="Retirer cette ligne ?"
          message={`« ${entry.label} » sera retiré du planning pour de bon.${libre ? '' : ' La recette, elle, reste dans tes recettes.'}`}
          confirmLabel={`Retirer « ${entry.label} »`}
          pending={remove.pending}
          error={remove.error}
          onConfirm={retirer}
          onCancel={() => setAsking(false)}
        />
      )}
    </>
  );
}
