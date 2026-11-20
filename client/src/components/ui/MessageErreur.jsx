import { CircleAlert } from 'lucide-react';

// Message d'erreur général d'un écran ou d'un formulaire (phrase claire, jamais de texte technique).
export default function MessageErreur({ children }) {
  if (!children) return null;
  return (
    <p
      role="alert"
      className="flex items-start gap-2 rounded-coin bg-erreur-fond p-3 font-text text-lecture text-erreur"
    >
      <CircleAlert size={20} strokeWidth={1.8} className="mt-0.5 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}
