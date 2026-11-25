import { useLayoutEffect, useRef } from 'react';
import { CircleAlert, Plus, X } from 'lucide-react';
import { emptyStep, oneLine } from '../../utils/recipes.js';
import Bouton from '../ui/Bouton.jsx';
import Ticket, { TicketEntete, TicketTirets } from '../ui/Ticket.jsx';

// L'éditeur d'étapes : un ticket « ÉTAPES », un champ par étape (« Étape 1 », « Étape 2 »…).
// Une étape peut être longue (le champ a plusieurs lignes) mais ne contient jamais de retour à la ligne.
// `steps` : [{ key, text }] ; `error` : message de l'API ou de la vérification.
export default function ChampsEtapes({ steps, onChange, error }) {
  const update = (key, text) =>
    onChange(steps.map((step) => (step.key === key ? { ...step, text: oneLine(text) } : step)));
  const remove = (key) => onChange(steps.filter((step) => step.key !== key));

  return (
    <Ticket aere>
      <TicketEntete titre="Étapes" sousTitre="une par champ" as="h2" />
      <TicketTirets />
      {steps.length === 0 && (
        <p className="py-2 text-center font-text text-lecture text-encre-2">
          Aucune étape pour l’instant.
        </p>
      )}
      <ul>
        {steps.map((step, index) => (
          <li
            key={step.key}
            className="border-b-2 border-dotted border-encre/25 py-3 last:border-b-0"
          >
            <div className="flex items-start gap-2">
              <ChampEtape
                numero={index + 1}
                value={step.text}
                onChange={(text) => update(step.key, text)}
              />
              <button
                type="button"
                onClick={() => remove(step.key)}
                aria-label={`Retirer l’étape ${index + 1}`}
                className="-mr-1 flex size-10 shrink-0 cursor-pointer items-center justify-center text-encre-2"
              >
                <X size={18} strokeWidth={1.8} aria-hidden="true" />
              </button>
            </div>
          </li>
        ))}
      </ul>
      <TicketTirets />
      {error && (
        <p role="alert" className="mb-3 flex items-start gap-1.5 font-text text-ui text-erreur">
          <CircleAlert size={14} strokeWidth={2} aria-hidden="true" className="mt-0.5 shrink-0" />
          {error}
        </p>
      )}
      <Bouton type="contour" className="w-full" onClick={() => onChange([...steps, emptyStep()])}>
        <Plus size={16} strokeWidth={1.8} aria-hidden="true" />
        Ajouter une étape
      </Bouton>
    </Ticket>
  );
}

// Le champ d'une étape : il grandit avec son texte, pour qu'une étape longue se lise en entier.
function ChampEtape({ numero, value, onChange }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const field = ref.current;
    if (!field) return;
    field.style.height = 'auto';
    field.style.height = `${field.scrollHeight + 3}px`;
  }, [value]);
  return (
    <textarea
      ref={ref}
      aria-label={`Étape ${numero}`}
      rows={2}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={`Étape ${numero}`}
      className="min-h-10 w-full min-w-0 flex-1 resize-none overflow-hidden rounded-coin border-[1.5px] border-trait bg-surface px-2 py-2 font-heading text-lecture leading-normal text-encre focus:border-2 focus:border-focus lg:text-ui"
    />
  );
}
