import { proteinOnlyShares } from '../../utils/macros.js';
import { formatNombre, jourComplet, jourCourt, numeroJour } from '../../utils/planning.js';
import Anneau from '../ui/Anneau.jsx';

// PC : la colonne des 7 jours, chacun avec son anneau, son nombre de créneaux et ses calories. Le jour choisi est cerclé de tomate.
// Un jour sans plat affiche « – » ; un jour dont aucune calorie n'est connue affiche « ? » (jamais 0).
export default function ListeJoursPc({ days, selected, onSelect }) {
  return (
    <nav aria-label="Jours de la semaine">
      <ul className="space-y-2">
        {days.map((day) => {
          const actif = day.date === selected;
          const rempli = day.entries.length > 0;
          const creneaux = new Set(day.entries.map((entry) => entry.slotId)).size;
          const kcal = day.totalCalories > 0 ? day.totalCalories : null;
          return (
            <li key={day.date}>
              <button
                type="button"
                onClick={() => onSelect(day.date)}
                aria-label={jourComplet(day.date)}
                aria-current={actif ? 'date' : undefined}
                className={`flex min-h-16 w-full cursor-pointer items-center gap-3 rounded-[18px] bg-surface px-3 py-2.5 text-left ${
                  actif ? 'shadow-[inset_0_0_0_2px_var(--tomate)]' : ''
                }`}
              >
                {rempli ? (
                  <Anneau
                    kcal={kcal}
                    partages={proteinOnlyShares(kcal, day.totalProteins)}
                    taille={40}
                    centre="vide"
                  />
                ) : (
                  <span
                    aria-hidden="true"
                    className="size-10 shrink-0 rounded-full border-2 border-dashed border-tirets"
                  />
                )}
                <span className="flex-1 font-semibold">
                  {jourCourt(day.date)}. {numeroJour(day.date)}
                  <small className="block text-libelle font-normal text-encre-2">
                    {rempli
                      ? `${creneaux} ${creneaux > 1 ? 'créneaux' : 'créneau'}`
                      : 'rien de prévu'}
                  </small>
                </span>
                <span className="font-bold">
                  {rempli ? (kcal === null ? '?' : formatNombre(kcal)) : '–'}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
