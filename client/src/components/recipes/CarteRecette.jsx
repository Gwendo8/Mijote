import { Clock, Users } from 'lucide-react';
import { Link } from 'react-router';
import Anneau from '../ui/Anneau.jsx';
import { macroShares, proteinOnlyShares } from '../../utils/macros.js';
import { basePath, formatMinutes, formatParts, totalMinutes } from '../../utils/recipes.js';
import { displayNameFor } from '../../utils/names.js';

// Une recette dans la liste : carte blanche centrée (anneau avec photo, titre, calories par part,
// protéines, durée et parts), qui est un lien vers la fiche (DESIGN.md § 6).
// `userId` sert à écrire « de Léa » sous les recettes des autres.
// `talon` : { libelle: 'Mer. midi', papier: 'menthe' }, posé en haut à gauche si la recette est au planning.
export default function CarteRecette({ recipe, userId, talon }) {
  const auteur = recipe.isMine ? null : displayNameFor(recipe.owner, userId);
  const nutrition = recipe.nutrition;
  const kcal = nutrition?.caloriesPerServing ?? null;
  const proteins = nutrition?.proteinsPerServing ?? null;
  const partages = macroShares(nutrition?.perServing ?? {}) ?? proteinOnlyShares(kcal, proteins);
  const total = totalMinutes(recipe);

  return (
    <li>
      <Link
        to={`${basePath(recipe.kind)}/${recipe.id}`}
        className="relative flex h-full flex-col items-center gap-2.5 rounded-carte bg-surface px-3 py-3.5 text-center transition-transform duration-150 hover:-translate-y-0.5"
      >
        {talon && (
          <span
            style={{ background: `var(--${talon.papier})` }}
            className="talon-dente absolute top-2.5 left-2 z-10 -rotate-6 rounded-[3px] px-2 pt-0.5 pb-1 text-[11.5px] font-semibold text-encre"
          >
            {talon.libelle}
          </span>
        )}
        <Anneau kcal={kcal} partages={partages} photoUrl={recipe.photoUrl} taille={100} />
        <h2 className="flex min-h-[2.4em] items-center text-[15px] leading-tight font-bold">
          {recipe.title}
        </h2>
        {kcal === null ? (
          <p className="rounded-lg border-[1.5px] border-dashed border-tirets px-2 py-0.5 text-[13px] text-encre-2">
            kcal à compléter
          </p>
        ) : (
          <>
            <p className="text-[22px] leading-none font-extrabold tracking-tight">
              {Math.round(kcal)}{' '}
              <small className="text-[12px] font-medium tracking-normal text-encre-2">
                kcal/part
              </small>
            </p>
            {proteins !== null && (
              <p className="text-[12.5px] font-semibold text-prot-texte">
                {Math.round(proteins)} g prot.
              </p>
            )}
          </>
        )}
        <p className="flex flex-wrap justify-center gap-x-2.5 gap-y-0.5 text-[12.5px] text-encre-2">
          {total > 0 && (
            <span className="inline-flex items-center gap-1">
              <Clock size={14} strokeWidth={1.9} aria-hidden="true" />
              {formatMinutes(total)}
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <Users size={14} strokeWidth={1.9} aria-hidden="true" />
            {formatParts(recipe.servings)}
          </span>
          {auteur && <span>de {auteur}</span>}
        </p>
      </Link>
    </li>
  );
}
