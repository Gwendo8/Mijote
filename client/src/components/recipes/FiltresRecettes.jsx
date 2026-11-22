import { useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { useTags } from '../../hooks/recipes/useTags.js';
import { PORTEES } from '../../utils/recipes.js';
import Champ from '../ui/Champ.jsx';
import Puce from '../ui/Puce.jsx';

// Les puces d'étiquettes (« Toutes » = aucune étiquette choisie ; plusieurs étiquettes = la recette doit les avoir toutes).
export function PucesEtiquettes({ tagIds, onChange }) {
  const { tags } = useTags();
  if (tags.length === 0) return null;
  const toggle = (id) =>
    onChange(tagIds.includes(id) ? tagIds.filter((tagId) => tagId !== id) : [...tagIds, id]);
  return (
    <div
      role="group"
      aria-label="Étiquettes"
      className="-mx-4 flex gap-1.5 overflow-x-auto px-4 py-0.5 lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0"
    >
      <Puce actif={tagIds.length === 0} onClick={() => onChange([])}>
        Toutes
      </Puce>
      {tags.map((tag) => (
        <Puce key={tag.id} actif={tagIds.includes(tag.id)} onClick={() => toggle(tag.id)}>
          {tag.name}
        </Puce>
      ))}
    </div>
  );
}

// Le bouton « Filtres » et son panneau : de qui sont les recettes, calories au plus, protéines au moins.
// `filters` : { scope, maxCalories, minProteins } (du texte) ; `onChange` reçoit les champs modifiés.
export function PanneauFiltres({ filters, onChange, idee = false }) {
  const [open, setOpen] = useState(
    filters.scope !== 'all' || Boolean(filters.maxCalories) || Boolean(filters.minProteins),
  );
  const actifs =
    (filters.scope !== 'all' ? 1 : 0) +
    (filters.maxCalories ? 1 : 0) +
    (filters.minProteins ? 1 : 0);

  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        aria-controls="panneau-filtres"
        onClick={() => setOpen(!open)}
        className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-coin border-[1.5px] border-encre bg-papier px-3 text-libelle font-bold"
      >
        <SlidersHorizontal size={16} strokeWidth={1.8} aria-hidden="true" />
        Filtres{actifs > 0 ? ` (${actifs})` : ''}
      </button>
      {open && (
        <div
          id="panneau-filtres"
          className="mt-3 space-y-3 border-[1.5px] border-dashed border-encre p-3"
        >
          <div
            role="group"
            aria-label={idee ? 'De qui sont les idées' : 'De qui sont les recettes'}
            className="flex flex-wrap gap-1.5"
          >
            {PORTEES.map((portee) => (
              <Puce
                key={portee.id}
                actif={filters.scope === portee.id}
                onClick={() => onChange({ scope: portee.id })}
              >
                {portee.label}
              </Puce>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Champ
              label="Calories par part, au plus"
              name="maxCalories"
              inputMode="numeric"
              autoComplete="off"
              placeholder="500"
              value={filters.maxCalories}
              onChange={(event) => onChange({ maxCalories: event.target.value })}
              help={
                idee
                  ? 'Les idées à compléter sont cachées.'
                  : 'Les recettes à compléter sont cachées.'
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
      )}
    </div>
  );
}
