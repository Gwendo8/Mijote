import { ArrowDown, ArrowUp, Pencil, Trash2 } from 'lucide-react';

const petit =
  'flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-coin border-[1.5px] border-trait bg-surface disabled:cursor-not-allowed disabled:opacity-40';

// Une ligne des réglages : nom, « créneau de base » ou « ajouté par toi », monter / descendre, renommer,
// supprimer (seulement ceux ajoutés) et l'interrupteur « affiché ». Rien n'est enregistré ici : les actions montent.
export default function CreneauReglage({
  slot,
  premier,
  dernier,
  busy,
  onToggle,
  onMove,
  onRename,
  onDelete,
}) {
  return (
    <li className="flex items-center gap-2 py-2">
      <div className="min-w-0 flex-1">
        <p className="font-extrabold [overflow-wrap:anywhere]">{slot.name}</p>
        <p className="text-mention text-encre-2">
          {slot.isDefault ? 'créneau de base' : 'ajouté par toi'}
          {slot.isHidden ? ' · masqué' : ''}
        </p>
      </div>
      <button
        type="button"
        className={petit}
        disabled={busy || premier}
        onClick={() => onMove(-1)}
        aria-label={`Monter « ${slot.name} »`}
      >
        <ArrowUp size={16} strokeWidth={1.8} aria-hidden="true" />
      </button>
      <button
        type="button"
        className={petit}
        disabled={busy || dernier}
        onClick={() => onMove(1)}
        aria-label={`Descendre « ${slot.name} »`}
      >
        <ArrowDown size={16} strokeWidth={1.8} aria-hidden="true" />
      </button>
      <button
        type="button"
        className={petit}
        disabled={busy}
        onClick={onRename}
        aria-label={`Renommer « ${slot.name} »`}
      >
        <Pencil size={16} strokeWidth={1.8} aria-hidden="true" />
      </button>
      {!slot.isDefault && (
        <button
          type="button"
          className={petit}
          disabled={busy}
          onClick={onDelete}
          aria-label={`Supprimer « ${slot.name} »`}
        >
          <Trash2 size={16} strokeWidth={1.8} aria-hidden="true" />
        </button>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={!slot.isHidden}
        aria-label={`Afficher « ${slot.name} »`}
        disabled={busy}
        onClick={onToggle}
        className={`relative h-7 w-12 shrink-0 cursor-pointer rounded-full border-[1.5px] border-trait disabled:cursor-not-allowed disabled:opacity-50 ${
          slot.isHidden ? 'bg-fond' : 'bg-tomate'
        }`}
      >
        <span
          aria-hidden="true"
          className={`absolute top-0.5 size-5 rounded-full border-[1.5px] border-trait bg-surface ${
            slot.isHidden ? 'left-0.5' : 'left-5.5'
          }`}
        />
      </button>
    </li>
  );
}
