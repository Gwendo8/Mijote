import { ShieldCheck } from 'lucide-react';
import { originalSummary } from '../../utils/foods.js';

// « Corrigé par l'admin » : rappelle la valeur d'origine, qui reste lisible.
// Téléphone : une ligne dans le ticket ; PC : une carte à côté (`carte`).
export default function NoteCorrection({ food, carte = false }) {
  const texte = (
    <>
      {originalSummary(food)}
      {food.correctionNote && ` ${food.correctionNote}`}
    </>
  );
  if (carte) {
    return (
      <div className="bg-surface p-3 text-encre">
        <p className="text-mention font-extrabold">Corrigé par l’admin</p>
        <p className="mt-1 text-ui leading-[1.45]">{texte}</p>
      </div>
    );
  }
  return (
    <p className="flex items-start gap-2 font-text text-ui leading-[1.45] text-encre">
      <ShieldCheck size={16} strokeWidth={1.8} aria-hidden="true" className="mt-0.5 shrink-0" />
      <span>
        <span className="sr-only">Corrigé par l’admin. </span>
        {texte}
      </span>
    </p>
  );
}
