import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatSemaine } from '../../utils/planning.js';

const bouton =
  'flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-coin border-[1.5px] border-encre bg-comptoir';

// « ‹ Semaine du 16 au 22 novembre › » : passe à la semaine d'avant ou d'après (`onMove(-1)` ou `onMove(1)`).
export default function NavigationSemaine({ monday, onMove }) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onMove(-1)}
        aria-label="Semaine précédente"
        className={bouton}
      >
        <ChevronLeft size={18} strokeWidth={1.8} aria-hidden="true" />
      </button>
      <p className="text-ui font-bold" aria-live="polite">
        Semaine du {formatSemaine(monday)}
      </p>
      <button
        type="button"
        onClick={() => onMove(1)}
        aria-label="Semaine suivante"
        className={bouton}
      >
        <ChevronRight size={18} strokeWidth={1.8} aria-hidden="true" />
      </button>
    </div>
  );
}
