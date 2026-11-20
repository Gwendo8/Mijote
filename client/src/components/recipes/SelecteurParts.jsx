import { Minus, Plus } from 'lucide-react';

const bouton =
  'flex size-9 cursor-pointer items-center justify-center rounded-coin border-[1.5px] border-encre bg-transparent hover:bg-papier disabled:cursor-not-allowed disabled:opacity-50';

// « PARTS » à gauche, − / nombre / + à droite : le nombre de parts qu'on veut cuisiner (les quantités suivent).
export default function SelecteurParts({ value, onChange, min = 1, max = 100 }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span id="parts-label" className="text-mention font-extrabold uppercase tracking-[0.06em]">
        Parts
      </span>
      <div role="group" aria-labelledby="parts-label" className="flex items-center gap-3">
        <button
          type="button"
          className={bouton}
          onClick={() => onChange(value - 1)}
          disabled={value <= min}
          aria-label="Une part de moins"
        >
          <Minus size={16} strokeWidth={2} aria-hidden="true" />
        </button>
        <output
          aria-live="polite"
          className="largeur-large w-8 text-center text-ticket-titre font-extrabold"
        >
          {value}
        </output>
        <button
          type="button"
          className={bouton}
          onClick={() => onChange(value + 1)}
          disabled={value >= max}
          aria-label="Une part de plus"
        >
          <Plus size={16} strokeWidth={2} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
