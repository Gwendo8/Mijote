import { useId, useState } from 'react';
import { CircleAlert, Eye, EyeOff, Lock } from 'lucide-react';

// Champ de saisie : libellé au-dessus (capitales), aide et message d'erreur dessous.
// `icone` : petite icône à gauche. Un champ mot de passe a un œil pour afficher le texte.
// `readOnly` : fond comptoir et cadenas (valeur imposée, comme l'e-mail d'une invitation).
// Le message d'erreur dit quoi faire ; il est lu par les lecteurs d'écran (aria-describedby).
export default function Champ({
  label,
  error,
  help,
  icone: Icone,
  className = '',
  type = 'text',
  ...inputProps
}) {
  const id = useId();
  const helpId = `${id}-aide`;
  const errorId = `${id}-erreur`;
  const describedBy = [error && errorId, help && helpId].filter(Boolean).join(' ') || undefined;
  const [visible, setVisible] = useState(false);
  const isPassword = type === 'password';
  const locked = Boolean(inputProps.readOnly);

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1 block text-libelle font-extrabold uppercase">
        {label}
      </label>
      <div className="relative">
        {Icone && (
          <Icone
            size={16}
            strokeWidth={1.8}
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-encre-2"
          />
        )}
        <input
          id={id}
          type={isPassword && visible ? 'text' : type}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          {...inputProps}
          className={`min-h-12 w-full rounded-coin border-[1.5px] font-heading text-lecture lg:text-ui ${
            Icone ? 'pl-10' : 'pl-3'
          } ${isPassword || locked ? 'pr-11' : 'pr-3'} ${
            error
              ? 'border-erreur bg-erreur-fond text-erreur'
              : 'border-encre bg-papier text-encre focus:border-2 focus:border-focus'
          } read-only:bg-comptoir read-only:text-encre-2`}
        />
        {locked && (
          <Lock
            size={16}
            strokeWidth={1.8}
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-encre-2"
          />
        )}
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible(!visible)}
            aria-pressed={visible}
            aria-label={visible ? 'Masquer le texte saisi' : 'Afficher le texte saisi'}
            className="absolute top-1/2 right-1 flex size-10 -translate-y-1/2 cursor-pointer items-center justify-center text-encre-2"
          >
            {visible ? (
              <EyeOff size={16} strokeWidth={1.8} aria-hidden="true" />
            ) : (
              <Eye size={16} strokeWidth={1.8} aria-hidden="true" />
            )}
          </button>
        )}
      </div>
      {error && (
        <p id={errorId} className="mt-1 flex items-start gap-1.5 font-text text-ui text-erreur">
          <CircleAlert size={14} strokeWidth={2} aria-hidden="true" className="mt-0.5 shrink-0" />
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
