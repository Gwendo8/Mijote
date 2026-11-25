import { useId } from 'react';
import { Minus, Plus } from 'lucide-react';

const bouton =
  'flex size-9 cursor-pointer items-center justify-center rounded-coin border-[1.5px] border-trait bg-transparent hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50';

// « PARTS » à gauche, − / nombre / + à droite : le nombre de parts qu'on veut cuisiner (les quantités suivent).
// `pas` : de combien le nombre bouge à chaque touche (1 pour une recette, 0,5 pour le planning).
export default function SelecteurParts({ value, onChange, min = 1, max = 100, pas = 1 }) {
  const labelId = useId();
  return (
    <div className="flex items-center justify-between gap-2">
      <span id={labelId} className="text-mention font-extrabold">
        Parts
      </span>
      <div role="group" aria-labelledby={labelId} className="flex items-center gap-3">
        <button
          type="button"
          className={bouton}
          onClick={() => onChange(value - pas)}
          disabled={value <= min}
          aria-label="Une part de moins"
        >
          <Minus size={16} strokeWidth={2} aria-hidden="true" />
        </button>
        <output aria-live="polite" className="min-w-8 text-center text-ticket-titre font-extrabold">
          {String(value).replace('.', ',')}
        </output>
        <button
          type="button"
          className={bouton}
          onClick={() => onChange(value + pas)}
          disabled={value >= max}
          aria-label="Une part de plus"
        >
          <Plus size={16} strokeWidth={2} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
