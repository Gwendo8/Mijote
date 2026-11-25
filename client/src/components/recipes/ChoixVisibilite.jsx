import { useId, useState } from 'react';
import { Search } from 'lucide-react';
import { useDebounced } from '../../hooks/common/useDebounced.js';
import { MIN_NAME_LENGTH, useUserSearch } from '../../hooks/recipes/useUserSearch.js';
import { displayNameFor } from '../../utils/names.js';
import { VISIBILITES } from '../../utils/recipes.js';
import MessageErreur from '../ui/MessageErreur.jsx';

// « Qui peut la voir ? » : moi seulement, des personnes choisies (recherchées par leur nom), tout le monde.
// `value` : { visibility, people } où people = [{ id, firstName, lastName }] ; `onChange` reçoit le même objet.
// Les personnes qui voient la recette peuvent la copier chez elles, jamais la modifier.
export default function ChoixVisibilite({ value, onChange, userId, error, legendeCachee = false }) {
  const name = useId();
  const { visibility, people } = value;

  const detail = (option) =>
    option.id === 'shared'
      ? people.length === 0
        ? 'choisis qui, par son nom'
        : `${people.length} ${people.length > 1 ? 'personnes' : 'personne'}`
      : option.detail;

  return (
    <fieldset className="space-y-2">
      <legend className={legendeCachee ? 'sr-only' : 'mb-2 text-libelle font-extrabold '}>
        Qui peut la voir ?
      </legend>
      {VISIBILITES.map((option) => {
        const actif = visibility === option.id;
        return (
          <div
            key={option.id}
            className={`rounded-coin px-2.5 py-2 ${actif && option.id === 'shared' ? 'bg-tomate-clair' : ''}`}
          >
            <label className="flex cursor-pointer items-start gap-3 py-0.5">
              <input
                type="radio"
                name={name}
                value={option.id}
                checked={actif}
                onChange={() => onChange({ ...value, visibility: option.id })}
                className="mt-0.5 size-5 shrink-0 cursor-pointer accent-tomate"
              />
              <span>
                <span className="block text-ui font-extrabold">{option.titre}</span>
                <span className="block text-mention text-encre-2">{detail(option)}</span>
              </span>
            </label>
            {actif && option.id === 'shared' && (
              <ChoixPersonnes
                people={people}
                userId={userId}
                onChange={(next) => onChange({ ...value, people: next })}
              />
            )}
          </div>
        );
      })}
      <MessageErreur>{error}</MessageErreur>
    </fieldset>
  );
}

export function ChoixPersonnes({ people, userId, onChange }) {
  const [q, setQ] = useState('');
  const search = useUserSearch(useDebounced(q));
  const chosen = new Set(people.map((person) => person.id));
  const found = search.people.filter((person) => !chosen.has(person.id));

  return (
    <div className="mt-2 space-y-2 pl-8">
      {people.length > 0 && (
        <ul>
          {people.map((person) => (
            <li key={person.id} className="flex items-baseline gap-2 py-0.5">
              <label className="flex flex-1 cursor-pointer items-baseline gap-2">
                <input
                  type="checkbox"
                  checked
                  onChange={() => onChange(people.filter((p) => p.id !== person.id))}
                  className="size-4 shrink-0 translate-y-0.5 cursor-pointer accent-encre"
                />
                <span>{displayNameFor(person, userId)}</span>
                <span
                  aria-hidden="true"
                  className="min-w-4 flex-1 translate-y-[-3px] self-end border-t-2 border-dotted border-encre/25"
                />
              </label>
            </li>
          ))}
        </ul>
      )}
      <div className="relative">
        <Search
          size={16}
          strokeWidth={1.8}
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-encre-2"
        />
        <input
          type="search"
          aria-label="Chercher une personne par son nom"
          placeholder="Chercher une personne"
          autoComplete="off"
          value={q}
          onChange={(event) => setQ(event.target.value)}
          className="min-h-11 w-full rounded-coin border-[1.5px] border-trait bg-surface pr-3 pl-9 font-heading text-lecture text-encre focus:border-2 focus:border-focus lg:text-ui"
        />
      </div>
      <MessageErreur>{search.error}</MessageErreur>
      {q.trim().length > 0 && q.trim().length < MIN_NAME_LENGTH && (
        <p className="font-text text-ui text-encre-2">Tape au moins 2 lettres.</p>
      )}
      {!search.idle && !search.loading && !search.error && found.length === 0 && (
        <p role="status" className="font-text text-ui text-encre-2">
          Personne de nouveau ne correspond à ce nom.
        </p>
      )}
      {found.length > 0 && (
        <ul className="divide-y-2 divide-dotted divide-tirets">
          {found.map((person) => (
            <li key={person.id}>
              <button
                type="button"
                onClick={() => {
                  onChange([...people, person]);
                  setQ('');
                }}
                className="w-full cursor-pointer py-2 text-left"
              >
                Ajouter {displayNameFor(person, userId)}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
