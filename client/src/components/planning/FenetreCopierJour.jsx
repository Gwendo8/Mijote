import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCopyDay } from '../../hooks/planning/usePlanning.js';
import { addDays, formatSemaine, jourComplet, mondayOf, weekDays } from '../../utils/planning.js';
import Bouton from '../ui/Bouton.jsx';
import Fenetre from '../ui/Fenetre.jsx';
import MessageErreur from '../ui/MessageErreur.jsx';

export const MAX_JOURS = 14;

const fleche =
  'flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-coin border-[1.5px] border-trait bg-fond';

// « Copier ce jour » : choisir 1 à 14 jours d'arrivée, dans n'importe quelle semaine. Le jour de départ n'est pas
// proposé. Les plats sont AJOUTÉS à ceux qui y sont déjà : rien n'est effacé. `onDone(count)` : copié.
export default function FenetreCopierJour({ fromDate, onDone, onClose }) {
  const [monday, setMonday] = useState(mondayOf(fromDate));
  const [chosen, setChosen] = useState([]);
  const copy = useCopyDay();
  const full = chosen.length >= MAX_JOURS;

  const toggle = (iso) =>
    setChosen((old) => (old.includes(iso) ? old.filter((d) => d !== iso) : [...old, iso].sort()));

  async function submit(event) {
    event.preventDefault();
    const result = await copy.run(fromDate, chosen);
    if (result.ok) onDone(result.data.count);
  }

  return (
    <Fenetre titre="Copier ce jour" onClose={onClose}>
      <form onSubmit={submit} noValidate>
        <p className="mb-3 font-text text-lecture leading-[1.55]">
          Les plats du {jourComplet(fromDate)} seront <strong>ajoutés</strong> à ceux qui sont déjà
          prévus les jours choisis. Rien n’est effacé.
        </p>
        <div className="mb-2 flex items-center justify-between gap-2">
          <button
            type="button"
            className={fleche}
            onClick={() => setMonday(addDays(monday, -7))}
            aria-label="Semaine précédente"
          >
            <ChevronLeft size={18} strokeWidth={1.8} aria-hidden="true" />
          </button>
          <p className="text-ui font-bold" aria-live="polite">
            Semaine du {formatSemaine(monday)}
          </p>
          <button
            type="button"
            className={fleche}
            onClick={() => setMonday(addDays(monday, 7))}
            aria-label="Semaine suivante"
          >
            <ChevronRight size={18} strokeWidth={1.8} aria-hidden="true" />
          </button>
        </div>
        <fieldset>
          <legend className="sr-only">Jours d’arrivée</legend>
          <ul className="divide-y-2 divide-dotted divide-tirets">
            {weekDays(monday)
              .filter((iso) => iso !== fromDate)
              .map((iso) => {
                const checked = chosen.includes(iso);
                return (
                  <li key={iso}>
                    <label className="flex min-h-11 cursor-pointer items-center gap-3 py-1">
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={!checked && full}
                        onChange={() => toggle(iso)}
                        className="size-5 shrink-0 cursor-pointer accent-tomate"
                      />
                      <span>{jourComplet(iso)}</span>
                    </label>
                  </li>
                );
              })}
          </ul>
        </fieldset>
        <p className="mt-2 font-text text-ui text-encre-2" role="status">
          {chosen.length === 0
            ? 'Choisis un ou plusieurs jours, dans cette semaine ou une autre.'
            : `${chosen.length} ${chosen.length > 1 ? 'jours choisis' : 'jour choisi'} (${MAX_JOURS} au plus).`}
        </p>
        <div className="my-3">
          <MessageErreur>{copy.error}</MessageErreur>
        </div>
        <div className="flex flex-col gap-3 lg:flex-row-reverse">
          <Bouton
            htmlType="submit"
            pending={copy.pending}
            pendingLabel="Copie…"
            disabled={chosen.length === 0}
          >
            Copier vers {chosen.length > 1 ? `${chosen.length} jours` : 'ce jour'}
          </Bouton>
          <Bouton type="contour" onClick={onClose}>
            Annuler
          </Bouton>
        </div>
      </form>
    </Fenetre>
  );
}
