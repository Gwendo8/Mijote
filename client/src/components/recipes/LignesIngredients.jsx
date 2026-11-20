import { useState } from 'react';
import { Check, CircleAlert, Plus, Search, X } from 'lucide-react';
import { foodName, formatNombre } from '../../utils/foods.js';
import { emptyRow } from '../../utils/recipes.js';
import SelecteurAliment from '../foods/SelecteurAliment.jsx';
import Bouton from '../ui/Bouton.jsx';
import Fenetre from '../ui/Fenetre.jsx';
import MessageErreur from '../ui/MessageErreur.jsx';
import Ticket, { TicketEntete, TicketTirets } from '../ui/Ticket.jsx';

const SOURCES = { ciqual: 'Ciqual', off: 'Open Food Facts', user: 'mon aliment' };

// L'éditeur d'ingrédients d'une recette : un ticket « INGRÉDIENTS, grammes à droite ».
// Chaque ligne : texte libre (« 4 œufs »), grammes, et soit « relié à un aliment » (calories calculées),
// soit « pas relié » avec le bouton « Relier ». « Négligeable » (sel, poivre) compte pour 0 kcal sans bloquer le calcul.
// `rows` : lignes du formulaire (voir emptyRow) ; `errors` : messages par champ, clés « 0.label », « 2.grams ».
export default function LignesIngredients({ rows, onChange, errors = {}, error, idee = false }) {
  const [adding, setAdding] = useState(false);
  const [linking, setLinking] = useState(null); // clé de la ligne à relier

  const update = (key, changes) =>
    onChange(rows.map((row) => (row.key === key ? { ...row, ...changes } : row)));
  const remove = (key) => onChange(rows.filter((row) => row.key !== key));

  return (
    <Ticket aere>
      <TicketEntete
        titre="Ingrédients"
        sousTitre={idee ? 'aliments et grammes' : 'grammes à droite'}
        as="h2"
      />
      <TicketTirets />
      {rows.length === 0 && (
        <p className="py-2 text-center font-text text-lecture text-encre-2">
          Aucun ingrédient pour l’instant.
        </p>
      )}
      <ul>
        {rows.map((row, index) => (
          <Ligne
            key={row.key}
            row={row}
            numero={index + 1}
            errors={{ label: errors[`${index}.label`], grams: errors[`${index}.grams`] }}
            onChange={(changes) => update(row.key, changes)}
            onRemove={() => remove(row.key)}
            onLink={() => setLinking(row.key)}
          />
        ))}
      </ul>
      <TicketTirets />
      <div className="mb-3">
        <MessageErreur>{error}</MessageErreur>
      </div>
      <Bouton type="contour" className="w-full" onClick={() => setAdding(true)}>
        <Plus size={16} strokeWidth={1.8} aria-hidden="true" />
        Ajouter un ingrédient
      </Bouton>

      {adding && (
        <Fenetre titre="Ajouter un ingrédient" onClose={() => setAdding(false)}>
          <SelecteurAliment
            onAdd={({ food, grams }) => {
              onChange([
                ...rows,
                emptyRow({
                  label: foodName(food),
                  food,
                  gramsText: String(grams).replace('.', ','),
                }),
              ]);
              setAdding(false);
            }}
          />
          {!idee && (
            <>
              <TicketTirets />
              <p className="mb-3 font-text text-ui text-encre-2">
                Pas dans la liste, ou pas besoin des calories exactes ? Écris la ligne à la main.
              </p>
              <Bouton
                type="contour"
                onClick={() => {
                  onChange([...rows, emptyRow()]);
                  setAdding(false);
                }}
              >
                Écrire une ligne à la main
              </Bouton>
            </>
          )}
        </Fenetre>
      )}
      {linking && (
        <Fenetre titre="Relier à un aliment" onClose={() => setLinking(null)}>
          <SelecteurAliment
            submitLabel="Relier"
            initialGrams={rows.find((row) => row.key === linking)?.gramsText || '100'}
            onAdd={({ food, grams }) => {
              update(linking, {
                food,
                gramsText: String(grams).replace('.', ','),
                isNegligible: false,
              });
              setLinking(null);
            }}
          />
        </Fenetre>
      )}
    </Ticket>
  );
}

function Ligne({ row, numero, errors, onChange, onRemove, onLink }) {
  const lie = Boolean(row.food);
  const champ =
    'min-h-10 rounded-coin border-[1.5px] bg-papier px-2 font-heading text-lecture text-encre lg:text-ui focus:border-2 focus:border-focus';
  return (
    <li className="border-b-2 border-dotted border-pointilles py-3 last:border-b-0">
      <div className="flex items-start gap-2">
        <input
          aria-label={`Ingrédient ${numero}`}
          aria-invalid={errors.label ? true : undefined}
          value={row.label}
          onChange={(event) => onChange({ label: event.target.value })}
          autoComplete="off"
          className={`${champ} min-w-0 flex-1 ${errors.label ? 'border-erreur bg-erreur-fond' : 'border-encre'}`}
        />
        <div className="flex shrink-0 items-center gap-1">
          <input
            aria-label={`Grammes de l’ingrédient ${numero}`}
            aria-invalid={errors.grams ? true : undefined}
            inputMode="decimal"
            autoComplete="off"
            placeholder="?"
            value={row.gramsText}
            onChange={(event) => onChange({ gramsText: event.target.value })}
            className={`${champ} w-18 text-right font-extrabold ${errors.grams ? 'border-erreur bg-erreur-fond' : 'border-encre'}`}
          />
          <span aria-hidden="true" className="font-extrabold">
            g
          </span>
        </div>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Retirer l’ingrédient ${numero}`}
          className="-mr-1 flex size-10 shrink-0 cursor-pointer items-center justify-center text-encre-2"
        >
          <X size={18} strokeWidth={1.8} aria-hidden="true" />
        </button>
      </div>
      {(errors.label || errors.grams) && (
        <p className="mt-1 flex items-start gap-1.5 font-text text-ui text-erreur">
          <CircleAlert size={14} strokeWidth={2} aria-hidden="true" className="mt-0.5 shrink-0" />
          {errors.label ?? errors.grams}
        </p>
      )}
      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-mention">
        {lie ? (
          <p className="flex items-center gap-1.5 text-encre-2">
            <Check size={14} strokeWidth={2.5} aria-hidden="true" className="shrink-0 text-vert" />
            <span>
              Relié à « {foodName(row.food)} » ({SOURCES[row.food.source] ?? row.food.source})
              {row.food.energyKcal !== null &&
                `, ${formatNombre(row.food.energyKcal, 0)} kcal/100 g`}
            </span>
          </p>
        ) : (
          !row.isNegligible && (
            <p className="flex items-center gap-1.5 text-erreur">
              <CircleAlert size={14} strokeWidth={2} aria-hidden="true" className="shrink-0" />
              Pas relié à un aliment
            </p>
          )
        )}
        <button
          type="button"
          onClick={onLink}
          className="inline-flex min-h-8 cursor-pointer items-center gap-1.5 rounded-coin border-[1.5px] border-encre px-2.5 font-extrabold"
        >
          <Search size={13} strokeWidth={2} aria-hidden="true" />
          {lie ? 'Changer' : 'Relier'}
        </button>
      </div>
      {(!lie || row.isNegligible) && (
        <label className="mt-2 flex cursor-pointer items-center gap-2 text-mention text-encre-2">
          <input
            type="checkbox"
            role="switch"
            checked={row.isNegligible}
            onChange={(event) => onChange({ isNegligible: event.target.checked })}
            className="size-4 cursor-pointer accent-vert"
          />
          Négligeable : compte pour 0 kcal
        </label>
      )}
    </li>
  );
}
