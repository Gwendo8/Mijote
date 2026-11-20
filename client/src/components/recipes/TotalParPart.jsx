import { TicketLigne, TicketTotal } from '../ui/Ticket.jsx';
import { formatNombre } from '../../utils/foods.js';

// Le bas du ticket : « PAR PART » avec le total souligné deux fois, puis « dont protéines ».
// Calories inconnues : « ? kcal ». Calcul partiel : le nombre connu et une phrase qui dit quoi faire.
export default function TotalParPart({ kcal, partialKcal = null, proteins, children }) {
  const valeur = kcal ?? partialKcal;
  return (
    <div>
      <TicketTotal
        libelle="Par part"
        valeur={valeur === null ? '? kcal' : `${formatNombre(valeur, 0)} kcal`}
      />
      <TicketLigne
        nom="dont protéines"
        valeur={proteins === null ? '? g' : `${formatNombre(proteins, 0)} g`}
      />
      {children}
    </div>
  );
}
