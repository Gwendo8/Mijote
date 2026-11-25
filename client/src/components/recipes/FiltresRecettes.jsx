import { useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import { useTags } from '../../hooks/recipes/useTags.js';
import { compterFiltres, PORTEES } from '../../utils/recipes.js';
import Bouton from '../ui/Bouton.jsx';
import Champ from '../ui/Champ.jsx';
import Fenetre from '../ui/Fenetre.jsx';

// Une case ou une pastille de choix : l'entrée native reste dans la page (clavier, lecteurs d'écran),
// seule sa case est dessinée (carré arrondi, encre quand c'est coché ; rond pour un choix unique).
function Choix({ type, name, checked, onChange, children }) {
  return (
    <label className="group flex min-h-11 cursor-pointer items-center gap-2.5 rounded-lg text-lecture lg:min-h-9">
      <input
        type={type}
        name={name}
        checked={checked}
        onChange={onChange}
        className="peer sr-only"
      />
      <i
        aria-hidden="true"
        className={`grid size-5 shrink-0 place-items-center border-2 border-tirets bg-surface peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus peer-checked:border-encre peer-checked:bg-encre ${
          type === 'radio' ? 'rounded-full' : 'rounded-md'
        } after:h-1.25 after:w-2.25 after:-translate-y-px after:-rotate-45 after:border-b-2 after:border-l-2 after:border-surface after:opacity-0 peer-checked:after:opacity-100 ${
          type === 'radio' ? 'after:hidden' : ''
        }`}
      />
      {children}
    </label>
  );
}

// Le contenu des filtres, le même sur PC (colonne de gauche) et sur téléphone (feuille du bas) :
// de qui sont les recettes, étiquettes (la recette doit les avoir toutes), calories au plus, protéines au moins.
// `filters` : { scope, maxCalories, minProteins, tagIds } ; `onChange` reçoit les champs modifiés.
function ContenuFiltres({ filters, onChange, idee }) {
  const { tags } = useTags();
  const toggle = (id) =>
    onChange({
      tagIds: filters.tagIds.includes(id)
        ? filters.tagIds.filter((tagId) => tagId !== id)
        : [...filters.tagIds, id],
    });
  return (
    <div className="space-y-4.5">
      <fieldset>
        <legend className="mb-1 text-libelle font-bold">
          {idee ? 'De qui sont les idées' : 'De qui sont les recettes'}
        </legend>
        {PORTEES.map((portee) => (
          <Choix
            key={portee.id}
            type="radio"
            name="portee"
            checked={filters.scope === portee.id}
            onChange={() => onChange({ scope: portee.id })}
          >
            {portee.label}
          </Choix>
        ))}
      </fieldset>
      {tags.length > 0 && (
        <fieldset>
          <legend className="mb-1 text-libelle font-bold">Étiquettes</legend>
          {tags.map((tag) => (
            <Choix
              key={tag.id}
              type="checkbox"
              name="etiquette"
              checked={filters.tagIds.includes(tag.id)}
              onChange={() => toggle(tag.id)}
            >
              {tag.name}
            </Choix>
          ))}
        </fieldset>
      )}
      <div className="space-y-3">
        <Champ
          label="Calories par part, au plus"
          name="maxCalories"
          inputMode="numeric"
          autoComplete="off"
          placeholder="500"
          value={filters.maxCalories}
          onChange={(event) => onChange({ maxCalories: event.target.value })}
          help={
            idee ? 'Les idées à compléter sont cachées.' : 'Les recettes à compléter sont cachées.'
          }
        />
        <Champ
          label="Protéines par part, au moins (g)"
          name="minProteins"
          inputMode="numeric"
          autoComplete="off"
          placeholder="20"
          value={filters.minProteins}
          onChange={(event) => onChange({ minProteins: event.target.value })}
        />
      </div>
    </div>
  );
}

// PC : la colonne de filtres, toujours visible à gauche des recettes.
export function ColonneFiltres({ filters, onChange, onReset, idee = false }) {
  return (
    <aside aria-label="Filtres" className="rounded-panneau bg-surface p-4.5">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-[18px] font-extrabold">Filtres</h2>
        {compterFiltres(filters) > 0 && (
          <button
            type="button"
            onClick={onReset}
            className="cursor-pointer text-libelle font-semibold text-tomate-fonce underline"
          >
            Tout effacer
          </button>
        )}
      </div>
      <ContenuFiltres filters={filters} onChange={onChange} idee={idee} />
    </aside>
  );
}

const puceActive =
  'inline-flex min-h-11 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-puce border-[1.5px] border-encre bg-encre px-3 text-ui font-semibold text-surface';

// Téléphone : la puce « Filtres » (avec la pastille du nombre de filtres actifs), puis une puce par filtre actif
// qu'on enlève d'un geste, et la feuille du bas qui contient les filtres.
export function BarreFiltres({ filters, onChange, total, idee = false }) {
  const [open, setOpen] = useState(false);
  const { tags } = useTags();
  const actifs = compterFiltres(filters);
  const portee = PORTEES.find((p) => p.id === filters.scope);
  const enlever = [
    filters.scope !== 'all' && {
      cle: 'scope',
      texte: portee?.label,
      retirer: () => onChange({ scope: 'all' }),
    },
    ...filters.tagIds.map((id) => ({
      cle: `tag-${id}`,
      texte: tags.find((tag) => tag.id === id)?.name ?? 'Étiquette',
      retirer: () => onChange({ tagIds: filters.tagIds.filter((tagId) => tagId !== id) }),
    })),
    filters.maxCalories && {
      cle: 'cal',
      texte: `Au plus ${filters.maxCalories} kcal`,
      retirer: () => onChange({ maxCalories: '' }),
    },
    filters.minProteins && {
      cle: 'prot',
      texte: `Au moins ${filters.minProteins} g de protéines`,
      retirer: () => onChange({ minProteins: '' }),
    },
  ].filter(Boolean);

  return (
    <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 py-0.5">
      <button
        type="button"
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-11 shrink-0 cursor-pointer items-center gap-1.5 rounded-puce border-[1.5px] border-trait bg-surface px-3 text-ui font-semibold"
      >
        <SlidersHorizontal size={16} strokeWidth={1.8} aria-hidden="true" />
        Filtres
        {actifs > 0 && (
          <span className="inline-grid h-5 min-w-5 place-items-center rounded-full bg-tomate px-1.5 text-mention font-bold text-sur-tomate">
            {actifs}
            <span className="sr-only"> actifs</span>
          </span>
        )}
      </button>
      {enlever.map((puce) => (
        <button
          key={puce.cle}
          type="button"
          onClick={puce.retirer}
          aria-label={`Enlever le filtre : ${puce.texte}`}
          className={puceActive}
        >
          {puce.texte}
          <X size={14} strokeWidth={2} aria-hidden="true" />
        </button>
      ))}
      {open && (
        <Fenetre titre="Filtres" onClose={() => setOpen(false)}>
          <ContenuFiltres filters={filters} onChange={onChange} idee={idee} />
          <Bouton className="mt-5 w-full" onClick={() => setOpen(false)}>
            {total === null
              ? 'Voir les résultats'
              : `Voir ${total} ${idee ? (total > 1 ? 'idées' : 'idée') : total > 1 ? 'recettes' : 'recette'}`}
          </Bouton>
        </Fenetre>
      )}
    </div>
  );
}
