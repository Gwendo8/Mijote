import { jourComplet, jourCourt, numeroJour } from '../../utils/planning.js';

// Téléphone : les 7 jours de la semaine, le jour choisi en encre.
export default function BarreJours({ days, selected, onSelect }) {
  return (
    <nav aria-label="Jours de la semaine" className="mb-4 flex gap-1.5">
      {days.map((date) => {
        const actif = date === selected;
        return (
          <button
            key={date}
            type="button"
            onClick={() => onSelect(date)}
            aria-label={jourComplet(date)}
            aria-current={actif ? 'date' : undefined}
            className={`flex min-h-12 flex-1 cursor-pointer flex-col items-center justify-center rounded-coin border-[1.5px] border-encre leading-tight ${
              actif ? 'bg-encre text-papier' : 'bg-papier text-encre'
            }`}
          >
            <span className="text-mention">{jourCourt(date)}</span>
            <span className="largeur-large text-lecture font-extrabold">{numeroJour(date)}</span>
          </button>
        );
      })}
    </nav>
  );
}
