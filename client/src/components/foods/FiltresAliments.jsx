import Puce from '../ui/Puce.jsx';
import { FILTRES } from '../../utils/foods.js';

// Les puces de la recherche : Tout, Ciqual, Produits (Open Food Facts), Mes aliments.
// Sur téléphone elles défilent sur une ligne si la place manque.
export default function FiltresAliments({ value, onChange }) {
  return (
    <div
      role="group"
      aria-label="Origine des aliments"
      className="-mx-4 flex gap-1.5 overflow-x-auto px-4 py-0.5 lg:mx-0 lg:overflow-visible lg:px-0"
    >
      {FILTRES.map((filtre) => (
        <Puce
          className="px-2.5"
          key={filtre.id}
          actif={value === filtre.id}
          onClick={() => onChange(filtre.id)}
        >
          {filtre.label}
        </Puce>
      ))}
    </div>
  );
}
