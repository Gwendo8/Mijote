import { proteinOnlyShares } from '../../utils/macros.js';
import { jourComplet, jourCourt, numeroJour } from '../../utils/planning.js';
import Anneau from '../ui/Anneau.jsx';

// Téléphone : les 7 jours de la semaine, chacun avec son petit anneau (rond en tirets s'il n'y a rien de prévu).
// Le jour choisi est cerclé de tomate. `days` : les jours de la semaine tels que les donne l'API.
export default function BarreJours({ days, selected, onSelect }) {
  return (
    <nav aria-label="Jours de la semaine" className="mb-4 grid grid-cols-7 gap-1">
      {days.map((day) => {
        const actif = day.date === selected;
        const rempli = day.entries.length > 0;
        const kcal = day.totalCalories > 0 ? day.totalCalories : null;
        return (
          <button
            key={day.date}
            type="button"
            onClick={() => onSelect(day.date)}
            aria-label={jourComplet(day.date)}
            aria-current={actif ? 'date' : undefined}
            className={`flex min-h-16 cursor-pointer flex-col items-center gap-1 rounded-[14px] pt-1.5 pb-2 text-mention font-semibold ${
              actif
                ? 'bg-surface text-encre shadow-[inset_0_0_0_2px_var(--tomate)]'
                : 'text-encre-2'
            }`}
          >
            <span>{jourCourt(day.date)}</span>
            {rempli ? (
              <Anneau
                kcal={kcal}
                partages={proteinOnlyShares(kcal, day.totalProteins)}
                taille={34}
                centre="vide"
              />
            ) : (
              <span
                aria-hidden="true"
                className="size-[34px] rounded-full border-2 border-dashed border-tirets"
              />
            )}
            <span>{numeroJour(day.date)}</span>
          </button>
        );
      })}
    </nav>
  );
}
