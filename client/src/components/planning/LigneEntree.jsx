import { formatNombre, formatParts } from '../../utils/planning.js';

// Une ligne du ticket du jour : le plat, des pointillés, ses calories. Toucher la ligne ouvre sa modification.
// Calories inconnues : « ? » (jamais 0). Recette retirée ou supprimée : les dernières calories connues, dites comme telles.
export default function LigneEntree({ entry, onOpen }) {
  const kcal = formatNombre(entry.calories);
  const retiree = entry.recipeAvailable === false;
  const details = [
    entry.servings && entry.servings !== 1 ? `${formatParts(entry.servings)} parts` : null,
    retiree ? 'recette retirée, dernières calories connues' : null,
    kcal === null ? 'calories à compléter, non comptées' : null,
  ].filter(Boolean);

  return (
    <button
      type="button"
      onClick={() => onOpen(entry)}
      aria-label={`Modifier : ${entry.label}`}
      className="block w-full cursor-pointer py-1 text-left hover:bg-comptoir/60 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus"
    >
      <span className="flex items-baseline gap-2">
        <span className="min-w-0 [overflow-wrap:anywhere]">{entry.label}</span>
        <span
          aria-hidden="true"
          className="min-w-4 flex-1 border-t-2 border-dotted border-pointilles"
        />
        <span className="shrink-0 font-bold">{kcal ?? '?'}</span>
      </span>
      {details.length > 0 && (
        <span className="block text-mention text-encre-2">{details.join(' · ')}</span>
      )}
    </button>
  );
}
