import { TicketEntete, TicketLigne, TicketPartie } from '../ui/Ticket.jsx';
import Anneau from '../ui/Anneau.jsx';
import { formatGrammes, formatKcal, sourceLabel } from '../../utils/foods.js';

// Haut d'une fiche aliment : nom, origine, anneau des macros et valeurs pour 100 g.
export default function FicheValeurs({ food }) {
  const detail = food.category ?? food.brand;
  return (
    <>
      <TicketEntete
        titre={food.name}
        sousTitre={[sourceLabel(food.source), detail].filter(Boolean).join(', ')}
      />
      <div className="my-3 flex justify-center py-2">
        <Anneau
          kcal={food.energyKcal}
          proteins={food.proteinsG}
          carbs={food.carbsG}
          fats={food.fatsG}
          taille={150}
          label={
            food.energyKcal === null
              ? 'Calories inconnues'
              : `${Math.round(food.energyKcal)} kcal pour 100 g`
          }
        />
      </div>
      <hr className="my-3 border-0 border-t-[1.5px] border-solid border-trait" />
      <TicketPartie>Pour 100 g</TicketPartie>
      <TicketLigne nom="calories" valeur={formatKcal(food.energyKcal)} />
      <TicketLigne nom="protéines" valeur={formatGrammes(food.proteinsG)} />
      <TicketLigne nom="glucides" valeur={formatGrammes(food.carbsG)} />
      <TicketLigne nom="lipides" valeur={formatGrammes(food.fatsG)} />
    </>
  );
}
