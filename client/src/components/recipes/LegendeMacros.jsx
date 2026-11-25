import { formatNombre } from '../../utils/foods.js';

// Sous l'anneau de la fiche : pastilles de couleur et grammes écrits (la couleur ne suffit jamais).
export default function LegendeMacros({ macros }) {
  const items = [
    ['Prot.', macros.proteins, 'bg-prot'],
    ['Gluc.', macros.carbs, 'bg-gluc'],
    ['Lip.', macros.fats, 'bg-lip'],
  ];
  return (
    <ul className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-libelle font-bold">
      {items.map(([nom, grammes, couleur]) => (
        <li key={nom} className="flex items-center gap-1.5">
          <span aria-hidden="true" className={`size-[9px] rounded-full ${couleur}`} />
          {nom} {formatNombre(grammes ?? 0, 0)} g
        </li>
      ))}
    </ul>
  );
}
