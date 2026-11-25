import { Link } from 'react-router';
import { foodName, foodSummary, formatKcal, formatNombre } from '../../utils/foods.js';

// Dans le ticket de résultats, l'en-tête dit déjà « kcal » : le nombre seul suffit.
const kcalNombre = (value) => formatNombre(value, 0);

// Une ligne de résultat (téléphone et sélecteur) : nom, pointillés, calories ; dessous la source et les protéines.
// Avec `onChoose` c'est un bouton (sélecteur) ; sinon un lien vers la fiche.
export default function AlimentLigne({ food, onChoose, unite = false }) {
  const contenu = (
    <>
      <span className="flex items-baseline gap-2">
        <span className="min-w-0 [overflow-wrap:anywhere]">{foodName(food)}</span>
        <span
          aria-hidden="true"
          className="min-w-4 flex-1 translate-y-[-3px] self-end border-t-2 border-dotted border-encre/25"
        />
        <span className="shrink-0 font-extrabold">
          {unite ? formatKcal(food.energyKcal) : kcalNombre(food.energyKcal)}
        </span>
      </span>
      <span className="mt-0.5 block text-mention font-normal text-encre-2">
        {foodSummary(food)}
      </span>
    </>
  );
  const classes = 'block w-full cursor-pointer py-2 text-left text-[15px] font-medium text-encre';

  return (
    <li>
      {onChoose ? (
        <button type="button" onClick={() => onChoose(food)} className={classes}>
          {contenu}
        </button>
      ) : (
        <Link to={`/aliments/${food.id}`} className={classes}>
          {contenu}
        </Link>
      )}
    </li>
  );
}
