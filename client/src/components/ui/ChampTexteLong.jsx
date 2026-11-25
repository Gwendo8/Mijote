import { useId } from 'react';
import { CircleAlert } from 'lucide-react';

// Champ de plusieurs lignes (étapes, description) : même habillage que Champ.
// La valeur saisie reste en police des titres (comme les autres champs) ; l'aide est en police des textes.
export default function ChampTexteLong({ label, error, help, rows = 5, className = '', ...props }) {
  const id = useId();
  const helpId = `${id}-aide`;
  const errorId = `${id}-erreur`;
  const describedBy = [error && errorId, help && helpId].filter(Boolean).join(' ') || undefined;
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-ui font-semibold">
        {label}
      </label>
      <textarea
        id={id}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...props}
        className={`w-full resize-y rounded-coin border-[1.5px] px-3 py-3 font-heading text-lecture leading-normal ${
          error
            ? 'border-erreur bg-erreur-fond text-erreur'
            : 'border-trait bg-fond text-encre focus:border-encre focus:bg-surface'
        }`}
      />
      {error && (
        <p
          id={errorId}
          className="mt-1.5 flex items-start gap-1.5 font-text text-[13px] text-erreur"
        >
          <CircleAlert size={14} strokeWidth={2} aria-hidden="true" className="mt-0.5 shrink-0" />
          {error}
        </p>
      )}
      {help && (
        <p id={helpId} className="mt-1.5 font-text text-[13px] text-encre-2">
          {help}
        </p>
      )}
    </div>
  );
}
