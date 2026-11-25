import { TicketLigne, TicketPartie } from '../ui/Ticket.jsx';
import Anneau from '../ui/Anneau.jsx';
import { foodName, formatGrammes, formatKcal, sourceLabel } from '../../utils/foods.js';

// Résultat d'un code-barres. `compact` (PC) : trois lignes ; sinon (téléphone) l'anneau, le nom et les valeurs.
export default function ProduitTrouve({ food, compact = false }) {
  if (compact) {
    return (
      <div aria-live="polite">
        <TicketLigne nom="Produit trouvé" valeur={sourceLabel(food.source)} />
        <TicketLigne nom={foodName(food)} valeur={formatKcal(food.energyKcal)} />
        <TicketLigne nom="dont protéines" valeur={formatGrammes(food.proteinsG)} />
      </div>
    );
  }
  return (
    <div aria-live="polite">
      <p className="text-center text-ticket-titre font-extrabold">Produit trouvé</p>
      <p className="text-center text-mention text-encre-2">{sourceLabel(food.source)}</p>
      <hr className="my-3 border-0 border-t-[1.5px] border-solid border-trait" />
      <div className="flex items-center gap-3">
        <Anneau
          kcal={food.energyKcal}
          proteins={food.proteinsG}
          carbs={food.carbsG}
          fats={food.fatsG}
          taille={60}
          label={
            food.energyKcal === null
              ? 'Calories inconnues'
              : `${Math.round(food.energyKcal)} kcal pour 100 g`
          }
        />
        <div className="min-w-0">
          <p className="font-extrabold [overflow-wrap:anywhere]">{food.name}</p>
          {food.brand && <p className="text-mention text-encre-2">{food.brand}</p>}
        </div>
      </div>
      <hr className="my-3 border-0 border-t-[1.5px] border-solid border-trait" />
      <TicketPartie>Pour 100 g</TicketPartie>
      <TicketLigne nom="calories" valeur={formatKcal(food.energyKcal)} />
      <TicketLigne nom="protéines" valeur={formatGrammes(food.proteinsG)} />
      <TicketLigne nom="glucides" valeur={formatGrammes(food.carbsG)} />
      <TicketLigne nom="lipides" valeur={formatGrammes(food.fatsG)} />
    </div>
  );
}
