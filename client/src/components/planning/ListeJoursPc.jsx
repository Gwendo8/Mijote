import { formatNombre, jourComplet, jourCourt, numeroJour } from '../../utils/planning.js';

// PC : une colonne de 7 mini-tickets (jour et total). Le jour choisi a un trait vert à gauche.
// Un jour sans plat affiche « rien » ; un jour dont aucune calorie n'est connue affiche « ? » (jamais 0).
export default function ListeJoursPc({ days, selected, onSelect }) {
  return (
    <nav aria-label="Jours de la semaine">
      <ul className="space-y-2">
        {days.map((day) => {
          const actif = day.date === selected;
          const rempli = day.entries.length > 0;
          return (
            <li key={day.date}>
              <button
                type="button"
                onClick={() => onSelect(day.date)}
                aria-label={jourComplet(day.date)}
                aria-current={actif ? 'date' : undefined}
                className={`flex min-h-12 w-full cursor-pointer items-center justify-between border-l-4 px-3 text-left ${
                  actif ? 'border-vert bg-vert-clair' : 'border-transparent bg-papier'
                }`}
              >
                <span className="text-libelle font-extrabold uppercase">
                  {jourCourt(day.date)} {numeroJour(day.date)}
                </span>
                {rempli ? (
                  <span className="largeur-etroite text-lecture font-extrabold">
                    {day.totalCalories > 0 || day.unknownCount === 0
                      ? formatNombre(day.totalCalories)
                      : '?'}
                  </span>
                ) : (
                  <span className="text-ui text-encre-2">rien</span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
