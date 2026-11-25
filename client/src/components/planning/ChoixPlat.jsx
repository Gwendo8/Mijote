import { useEffect, useId, useState } from 'react';
import { Search } from 'lucide-react';
import { useRecipes } from '../../hooks/recipes/useRecipes.js';
import { macroShares, proteinOnlyShares } from '../../utils/macros.js';
import { displayNameFor } from '../../utils/names.js';
import Chargement from '../ui/Chargement.jsx';
import MessageErreur from '../ui/MessageErreur.jsx';
import Anneau from '../ui/Anneau.jsx';

// Liste des recettes (ou des idées) à choisir : recherche, puis une ligne par plat avec son anneau et ses calories par part.
// `selectedId` / `onSelect(recette)` : le plat choisi. `userId` sert à écrire « de Léa » pour les plats des autres.
export default function ChoixPlat({ kind, selectedId, onSelect, userId }) {
  const name = useId();
  const [text, setText] = useState('');
  const [q, setQ] = useState('');
  const idee = kind === 'idea';
  const { items, loading, error } = useRecipes({ kind, q: q || undefined });

  // On attend la fin de la frappe avant de chercher
  useEffect(() => {
    const timer = setTimeout(() => setQ(text.trim()), 250);
    return () => clearTimeout(timer);
  }, [text]);

  return (
    <div>
      <div className="relative mb-3">
        <Search
          size={18}
          strokeWidth={1.8}
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-encre-2"
        />
        <input
          type="search"
          value={text}
          onChange={(event) => setText(event.target.value)}
          aria-label={idee ? 'Chercher une idée' : 'Chercher une recette'}
          placeholder={idee ? 'Chercher une idée' : 'Chercher une recette'}
          className="min-h-12 w-full rounded-coin border-[1.5px] border-trait bg-surface pr-3 pl-10 font-heading text-lecture focus:border-2 focus:border-focus lg:text-ui"
        />
      </div>
      <MessageErreur>{error}</MessageErreur>
      {loading && items.length === 0 && <Chargement label="Chargement de la liste…" />}
      {!loading && !error && items.length === 0 && (
        <p className="py-6 text-center font-text text-lecture text-encre-2">
          {q
            ? `Aucun résultat pour « ${q} ».`
            : idee
              ? 'Tu n’as pas encore d’idée de plat. Crée-en une depuis l’onglet Idées.'
              : 'Tu n’as pas encore de recette. Crée-en une depuis l’onglet Recettes.'}
        </p>
      )}
      {items.length > 0 && (
        <ul className="max-h-72 space-y-1 overflow-y-auto">
          {items.map((recipe) => {
            const kcal = recipe.nutrition?.caloriesPerServing ?? null;
            const proteins = recipe.nutrition?.proteinsPerServing ?? null;
            const partages =
              macroShares(recipe.nutrition?.perServing ?? {}) ?? proteinOnlyShares(kcal, proteins);
            const auteur = recipe.isMine ? null : displayNameFor(recipe.owner, userId);
            return (
              <li key={recipe.id}>
                <label
                  className={`flex cursor-pointer items-center gap-3 rounded-coin p-2 has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-focus ${
                    recipe.id === selectedId ? 'bg-tomate-clair' : ''
                  }`}
                >
                  <input
                    type="radio"
                    name={name}
                    checked={recipe.id === selectedId}
                    onChange={() => onSelect(recipe)}
                    className="peer sr-only"
                  />
                  <Anneau
                    kcal={kcal}
                    photoUrl={recipe.photoUrl}
                    partages={partages}
                    taille={44}
                    label={`Anneau de ${recipe.title}`}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-ui font-extrabold">{recipe.title}</span>
                    <span className="block text-mention text-encre-2">
                      {kcal === null ? 'kcal à compléter' : `${Math.round(kcal)} kcal par part`}
                      {auteur ? `, de ${auteur}` : ''}
                    </span>
                  </span>
                  <span
                    aria-hidden="true"
                    className="flex size-5 shrink-0 items-center justify-center rounded-full border-[1.5px] border-trait bg-surface peer-checked:border-tomate peer-checked:after:size-2.5 peer-checked:after:rounded-full peer-checked:after:bg-tomate"
                  />
                </label>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
