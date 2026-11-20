import { useId } from 'react';

// Champ de saisie : libellé au-dessus (capitales), aide et message d'erreur dessous.
// Le message d'erreur dit quoi faire, en Atkinson ; il est lu par les lecteurs d'écran (aria-describedby).
export default function Champ({ label, error, help, className = '', ...inputProps }) {
  const id = useId();
  const helpId = `${id}-aide`;
  const errorId = `${id}-erreur`;
  const describedBy = [error && errorId, help && helpId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1 block text-libelle font-extrabold uppercase">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...inputProps}
        className={`min-h-12 w-full rounded-coin border-[1.5px] px-3 font-heading text-lecture lg:text-ui ${
          error
            ? 'border-erreur bg-erreur-fond text-erreur'
            : 'border-encre bg-papier text-encre focus:border-2 focus:border-focus'
        } read-only:bg-comptoir read-only:text-encre-2`}
      />
      {error && (
        <p id={errorId} className="mt-1 font-text text-ui text-erreur">
          {error}
        </p>
      )}
      {help && (
        <p id={helpId} className="mt-1 font-text text-ui text-encre-2">
          {help}
        </p>
      )}
    </div>
  );
}
