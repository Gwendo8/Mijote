import { Loader } from 'lucide-react';

const base =
  // Téléphone : 44 px de haut (minimum conseillé pour le doigt), texte 12 px ; PC : 48 px, texte 13 px.
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-coin px-4 font-heading text-libelle font-extrabold ' +
  'lg:min-h-12 lg:px-5 lg:text-ui ' +
  'disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';

const types = {
  principal: 'bg-vert text-sur-vert hover:brightness-90',
  noir: 'bg-encre text-papier hover:brightness-90',
  contour: 'border-[1.5px] border-encre bg-transparent text-encre hover:bg-papier',
  danger: 'bg-erreur text-papier hover:brightness-90',
};

// Bouton de l'appli. `type` = principal (vert), noir, contour ou danger. Pendant l'envoi : « Impression… ».
// `to` fait un lien (composant Link passé par la page) : on garde ici l'affichage seulement.
export default function Bouton({
  type = 'principal',
  pending = false,
  pendingLabel = 'Impression…',
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
          <Loader size={18} strokeWidth={1.8} className="animate-spin" aria-hidden="true" />
          {pendingLabel}
        </>
      ) : (
        children
      )}
    </Tag>
  );
}
