import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router';
import { proteinOnlyShares } from '../../utils/macros.js';
import { formatNombre, groupBySlot, jourComplet, papierDuCreneau } from '../../utils/planning.js';
import Anneau from '../ui/Anneau.jsx';

// Le bandeau du jour, au-dessus des recettes : un petit anneau, le total prévu aujourd'hui, et un lien vers le planning.
// Sur PC, une pastille de papier par créneau (sa couleur, ses calories). `jour` : le jour du planning ; `slots` : les créneaux.
// Rien d'affiché si le planning du jour est vide : le bandeau ne sert qu'à rappeler ce qui est prévu.
export default function BandeauJour({ jour, slots }) {
  if (!jour || jour.entries.length === 0) return null;
  const kcal = jour.totalCalories > 0 ? jour.totalCalories : null;
  const groupes = groupBySlot(jour.entries, slots);
  return (
    <Link
      to="/planning"
      className="mb-4 flex items-center gap-3.5 rounded-[20px] bg-surface px-3.5 py-3"
    >
      <Anneau
        kcal={kcal}
        partages={proteinOnlyShares(kcal, jour.totalProteins)}
        taille={54}
        centre="vide"
      />
      <span className="min-w-0">
        <span className="block text-libelle text-encre-2">
          Aujourd’hui, {jourComplet(jour.date).split(' ')[0]}
        </span>
        <b className="block text-[17px]">
          {kcal === null ? 'Calories à compléter' : `${formatNombre(kcal)} kcal prévues`}
        </b>
      </span>
      <span className="ml-auto hidden gap-2 lg:flex">
        {groupes.map(({ slot, entries }) => {
          const connues = entries.filter((entry) => entry.calories !== null);
          const total = connues.reduce((somme, entry) => somme + entry.calories, 0);
          return (
            <span
              key={slot.id}
              style={{ background: `var(--${papierDuCreneau(slots.indexOf(slot))})` }}
              className="rounded-[10px] px-3 py-1.5 text-mention leading-tight text-encre"
            >
              {slot.name}
              <b className="block text-[15px]">{connues.length > 0 ? formatNombre(total) : '?'}</b>
            </span>
          );
        })}
      </span>
      <span className="ml-auto flex items-center gap-1 text-ui font-semibold text-tomate-fonce lg:ml-2.5">
        <span className="hidden lg:inline">Voir le planning</span>
        <ChevronRight size={20} strokeWidth={1.8} aria-hidden="true" className="lg:hidden" />
      </span>
    </Link>
  );
}
