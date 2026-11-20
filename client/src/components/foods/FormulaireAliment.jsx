import { useState } from 'react';
import { ScanBarcode } from 'lucide-react';
import FenetreScan from './FenetreScan.jsx';
import Bouton from '../ui/Bouton.jsx';
import Champ from '../ui/Champ.jsx';
import MessageErreur from '../ui/MessageErreur.jsx';
import { foodFormSchema, foodFormValues } from '../../schemas/foods.js';
import { toFieldText } from '../../utils/foods.js';
import { validate } from '../../utils/validate.js';

const AIDE =
  'Cet aliment est à toi. Les personnes qui voient une de tes recettes qui l’utilise voient aussi ses valeurs.';

// Formulaire d'un aliment perso (valeurs pour 100 g). Vérifie les saisies avant l'envoi ;
// les erreurs de l'API (`fieldErrors`) s'affichent aussi sous les champs.
// `onSubmit` reçoit le corps prêt pour l'API.
export default function FormulaireAliment({
  initial,
  pending = false,
  error = null,
  fieldErrors = {},
  onSubmit,
  onCancel,
  children,
}) {
  const [fields, setFields] = useState({
    name: initial?.name ?? '',
    brand: initial?.brand ?? '',
    energyKcal: toFieldText(initial?.energyKcal),
    proteinsG: toFieldText(initial?.proteinsG),
    carbsG: toFieldText(initial?.carbsG),
    fatsG: toFieldText(initial?.fatsG),
    barcode: initial?.barcode ?? '',
  });
  const [errors, setErrors] = useState({});
  const [scanning, setScanning] = useState(false);
  const change = (field) => (event) => setFields({ ...fields, [field]: event.target.value });
  const shown = { ...fieldErrors, ...errors };

  function submit(event) {
    event.preventDefault();
    const result = validate(foodFormSchema, foodFormValues(fields));
    setErrors(result.errors ?? {});
    if (result.errors) return;
    onSubmit({
      ...result.data,
      brand: result.data.brand || null,
      barcode: result.data.barcode || null,
    });
  }

  const number = (field, label) => (
    <Champ
      label={label}
      name={field}
      inputMode="decimal"
      autoComplete="off"
      value={fields[field]}
      onChange={change(field)}
      error={shown[field]}
      placeholder="0"
    />
  );

  return (
    <>
      <form onSubmit={submit} noValidate className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-2">
          <Champ
            label="Nom"
            name="name"
            autoComplete="off"
            value={fields.name}
            onChange={change('name')}
            error={shown.name}
          />
          <Champ
            label="Marque (facultatif)"
            name="brand"
            autoComplete="off"
            placeholder="Par exemple : Siggi’s"
            value={fields.brand}
            onChange={change('brand')}
            error={shown.brand}
          />
        </div>
        <fieldset>
          <legend className="mb-2 flex w-full items-center gap-2 text-mention font-extrabold uppercase tracking-[0.06em]">
            <span className="lg:text-encre-2">Pour 100 g</span>
            <span
              aria-hidden="true"
              className="hidden flex-1 border-t-2 border-dotted border-pointilles lg:block"
            />
          </legend>
          <div className="grid grid-cols-2 items-start gap-3 lg:grid-cols-4">
            {number('energyKcal', 'Calories (kcal)')}
            {number('proteinsG', 'Protéines (g)')}
            {number('carbsG', 'Glucides (g)')}
            {number('fatsG', 'Lipides (g)')}
          </div>
        </fieldset>
        {/* Code-barres et bouton de scan à côté, comme la maquette */}
        <div className="flex items-start gap-2.5">
          <div className="min-w-0 flex-1">
            <Champ
              label="Code-barres (facultatif)"
              name="barcode"
              inputMode="numeric"
              autoComplete="off"
              placeholder="13 chiffres"
              value={fields.barcode}
              onChange={change('barcode')}
              error={shown.barcode}
            />
          </div>
          <button
            type="button"
            onClick={() => setScanning(true)}
            aria-label="Scanner le code-barres"
            className="mt-[26px] flex size-12 shrink-0 cursor-pointer items-center justify-center rounded-coin border-[1.5px] border-encre"
          >
            <ScanBarcode size={20} strokeWidth={1.8} aria-hidden="true" />
          </button>
        </div>
        {children}
        <p className="font-text text-ui text-encre-2">{AIDE}</p>
        <MessageErreur>{error}</MessageErreur>
        <div className="flex flex-col gap-3 lg:flex-row-reverse lg:justify-start">
          <Bouton
            htmlType="submit"
            pending={pending}
            pendingLabel="Enregistrement…"
            className="lg:min-w-48"
          >
            Enregistrer l’aliment
          </Bouton>
          {onCancel && (
            <Bouton type="contour" onClick={onCancel} className="max-lg:hidden">
              Annuler
            </Bouton>
          )}
        </div>
      </form>
      {/* Hors du formulaire : la fenêtre de scan a son propre formulaire (saisie du numéro) */}
      {scanning && (
        <FenetreScan
          onClose={() => setScanning(false)}
          onCode={(code) => {
            setFields((current) => ({ ...current, barcode: code }));
            setScanning(false);
          }}
        />
      )}
    </>
  );
}
