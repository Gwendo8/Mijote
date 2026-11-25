import { Check } from 'lucide-react';

// Confirmation d'un enregistrement : message court avec une coche (DESIGN.md § 6).
// Jamais la couleur seule : le texte dit ce qui s'est passé.
export default function Confirmation({ children = 'Enregistré' }) {
  return (
    <p role="status" className="animate-tamponner flex items-center gap-2 font-text text-lecture">
      <Check size={18} strokeWidth={2.4} aria-hidden="true" className="shrink-0" />
      <span>{children}</span>
    </p>
  );
}
