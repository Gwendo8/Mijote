import { useId, useState } from 'react';
import { Check } from 'lucide-react';
import { formatNombre } from '../../utils/foods.js';

// Un ingrédient d'une fiche : case à cocher (on coche en cuisinant : texte barré, encre pâle), nom, pointillés, grammes.
// Pas de grammes et pas négligeable : « ? g » (l'ingrédient est à compléter).
// Idée de plat : pas de case à cocher (`cochable={false}`), une ligne de détail sous le nom (« Ciqual, 150 g »)
// et `valeur` remplace les grammes à droite (les calories de la ligne).
export default function LigneIngredient({
  label,
  grams,
  negligible,
  cochable = true,
  detail = null,
  valeur: valeurImposee = null,
}) {
  const id = useId();
  const [checked, setChecked] = useState(false);
  const valeur =
    valeurImposee ?? (grams !== null ? `${formatNombre(grams)} g` : negligible ? '0' : '? g');

  const pointilles = (
    <span
      aria-hidden="true"
      className="min-w-4 flex-1 translate-y-[-3px] self-end border-t-2 border-dotted border-encre/25"
    />
  );

  if (!cochable) {
    return (
      <li className="py-1">
        <div className="flex items-baseline gap-2">
          <span className="min-w-0 [overflow-wrap:anywhere]">{label}</span>
          {pointilles}
          <span className="shrink-0 font-extrabold">{valeur}</span>
        </div>
        {detail && <p className="text-mention text-encre-2">{detail}</p>}
      </li>
    );
  }

  return (
    <li className="flex items-baseline gap-2 py-1">
      <span className="relative flex size-4 shrink-0 translate-y-0.5 items-center justify-center">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(event) => setChecked(event.target.checked)}
          className="peer absolute inset-0 m-0 size-4 cursor-pointer appearance-none rounded-[2px] border-[1.5px] border-trait bg-surface checked:bg-encre"
        />
        <Check
          size={12}
          strokeWidth={3}
          aria-hidden="true"
          className="pointer-events-none relative text-surface opacity-0 peer-checked:opacity-100"
        />
      </span>
      <label
        htmlFor={id}
        className={`min-w-0 cursor-pointer [overflow-wrap:anywhere] ${checked ? 'text-encre-2 line-through' : ''}`}
      >
        {label}
      </label>
      {pointilles}
      <span className={`shrink-0 font-extrabold ${checked ? 'text-encre-2' : ''}`}>{valeur}</span>
    </li>
  );
}
