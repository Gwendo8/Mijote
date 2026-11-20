import { useState } from 'react';
import Bouton from '../ui/Bouton.jsx';
import Champ from '../ui/Champ.jsx';
import Fenetre from '../ui/Fenetre.jsx';
import MessageErreur from '../ui/MessageErreur.jsx';
import { correctionFieldsSchema } from '../../schemas/foods.js';
import { parseDecimal, toFieldText } from '../../utils/foods.js';
import { validate } from '../../utils/validate.js';
import { useRemoveCorrection, useSaveCorrection } from '../../hooks/foods/useFoodActions.js';

const CHAMPS = [
  ['energyKcal', 'Calories (kcal)'],
  ['proteinsG', 'Protéines (g)'],
  ['carbsG', 'Glucides (g)'],
  ['fatsG', 'Lipides (g)'],
];

// Correction d'un aliment commun par l'admin. L'aliment d'origine n'est jamais modifié : la correction
// est gardée à côté, et la valeur d'origine reste affichée sur la fiche.
// On envoie seulement ce qui diffère de la valeur d'origine ; « Revenir à l'origine » efface la correction.
export default function FenetreCorrection({ food, onClose, onDone }) {
  const base = food.original ?? food;
  const save = useSaveCorrection(food.id);
  const remove = useRemoveCorrection(food.id);
  const [fields, setFields] = useState({
    name: food.name,
    energyKcal: toFieldText(food.energyKcal),
    proteinsG: toFieldText(food.proteinsG),
    carbsG: toFieldText(food.carbsG),
    fatsG: toFieldText(food.fatsG),
    note: food.correctionNote ?? '',
  });
  const [errors, setErrors] = useState({});
  const change = (field) => (event) => setFields({ ...fields, [field]: event.target.value });

  async function submit(event) {
    event.preventDefault();
    const typed = {
      name: fields.name,
      energyKcal: parseDecimal(fields.energyKcal),
      proteinsG: parseDecimal(fields.proteinsG),
      carbsG: parseDecimal(fields.carbsG),
      fatsG: parseDecimal(fields.fatsG),
      note: fields.note,
    };
    const result = validate(correctionFieldsSchema, typed);
    if (result.errors) return setErrors(result.errors);

    const body = {};
    if (result.data.name && result.data.name !== base.name) body.name = result.data.name;
    for (const [field] of CHAMPS) {
      if (result.data[field] !== null && result.data[field] !== base[field]) {
        body[field] = result.data[field];
      }
    }
    if (Object.keys(body).length === 0) {
      return setErrors({
        energyKcal: 'Change au moins une valeur pour enregistrer une correction',
      });
    }
    setErrors({});
    if (result.data.note) body.note = result.data.note;
    const outcome = await save.run(body);
    if (outcome.ok) onDone('Correction enregistrée.');
  }

  async function reset() {
    const outcome = await remove.run();
    if (outcome.ok) onDone('Retour à la valeur d’origine.');
  }

  const shown = { ...save.fieldErrors, ...errors };

  return (
    <Fenetre titre="Corriger cet aliment" onClose={onClose} large>
      <form onSubmit={submit} noValidate className="space-y-4">
        <p className="font-text text-ui text-encre-2">
          La valeur d’origine ({base.source === 'ciqual' ? 'Ciqual' : 'Open Food Facts'}) n’est pas
          modifiée : elle reste affichée sur la fiche.
        </p>
        <Champ
          label="Nom"
          name="name"
          value={fields.name}
          onChange={change('name')}
          error={shown.name}
        />
        <div className="grid grid-cols-2 items-start gap-3">
          {CHAMPS.map(([field, label]) => (
            <Champ
              key={field}
              label={label}
              name={field}
              inputMode="decimal"
              autoComplete="off"
              value={fields[field]}
              onChange={change(field)}
              error={shown[field]}
            />
          ))}
        </div>
        <Champ
          label="Note (facultatif)"
          name="note"
          value={fields.note}
          onChange={change('note')}
          error={shown.note}
          help="Par exemple : valeur vérifiée sur l’emballage."
        />
        <MessageErreur>{save.error ?? remove.error}</MessageErreur>
        <div className="flex flex-col gap-3">
          <Bouton htmlType="submit" pending={save.pending} pendingLabel="Enregistrement…">
            Enregistrer la correction
          </Bouton>
          {food.isCorrected && (
            <Bouton type="contour" pending={remove.pending} pendingLabel="Retour…" onClick={reset}>
              Revenir à la valeur d’origine
            </Bouton>
          )}
          <Bouton type="contour" onClick={onClose}>
            Annuler
          </Bouton>
        </div>
      </form>
    </Fenetre>
  );
}
