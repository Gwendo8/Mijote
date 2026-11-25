import { useTags } from '../../hooks/recipes/useTags.js';
import Puce from '../ui/Puce.jsx';

// Les étiquettes de la recette (Végé, Rapide…), au choix, plusieurs possibles. `value` : liste d'identifiants.
export default function ChoixEtiquettes({ value, onChange }) {
  const { tags, error } = useTags();
  if (error || tags.length === 0) return null;
  const toggle = (id) =>
    onChange(value.includes(id) ? value.filter((tagId) => tagId !== id) : [...value, id]);
  return (
    <fieldset>
      <legend className="mb-2 text-libelle font-extrabold">Étiquettes</legend>
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <Puce key={tag.id} actif={value.includes(tag.id)} onClick={() => toggle(tag.id)}>
            {tag.name}
          </Puce>
        ))}
      </div>
    </fieldset>
  );
}
