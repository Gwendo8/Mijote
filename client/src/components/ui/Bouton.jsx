import { Loader } from 'lucide-react';

// Bouton : 50 px de haut, coins de 14 px, texte de 16 px en 700 (DESIGN.md § 6).
const base =
  'inline-flex min-h-12.5 items-center justify-center gap-2 rounded-coin px-5 font-heading text-lecture font-bold ' +
  'transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';

const types = {
  principal: 'bg-tomate text-sur-tomate hover:bg-tomate-fonce',
  noir: 'bg-encre text-surface hover:opacity-90',
  contour: 'border-[1.5px] border-trait bg-surface text-encre hover:border-encre-2',
  danger: 'bg-erreur text-surface hover:opacity-90',
};

// Bouton de l'appli. `type` = principal (tomate), noir, contour (secondaire) ou danger.
// Pendant l'envoi : petite roue et « Enregistrement… ».
// `to` fait un lien (composant Link passé par la page) : on garde ici l'affichage seulement.
export default function Bouton({
  type = 'principal',
  pending = false,
  pendingLabel = 'Enregistrement…',
  className = '',
  children,
  htmlType = 'button',
  as: Tag = 'button',
  disabled = false,
  ...props
}) {
  const isButton = Tag === 'button';
  return (
    <Tag
      {...(isButton ? { type: htmlType, disabled: pending || disabled } : {})}
      aria-busy={pending || undefined}
      {...props}
      className={`${base} ${types[type]} ${className}`}
    >
      {pending ? (
        <>
          <Loader size={18} strokeWidth={1.9} className="animate-spin" aria-hidden="true" />
          {pendingLabel}
        </>
      ) : (
        children
      )}
    </Tag>
  );
}
