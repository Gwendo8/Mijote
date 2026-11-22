import { groupBySlot, formatNombre, jourComplet } from '../../utils/planning.js';
import CodeBarres from '../ui/CodeBarres.jsx';
import Ticket, {
  TicketEntete,
  TicketLigne,
  TicketPartie,
  TicketTirets,
  TicketTotal,
} from '../ui/Ticket.jsx';
import LigneEntree from './LigneEntree.jsx';

// Le ticket d'un jour : une partie par créneau, une ligne par plat, total souligné deux fois, protéines.
// `day` : { date, entries, totalCalories, totalProteins, unknownCount } ; `slots` : les créneaux de la semaine.
// La page met `key={date}` : à chaque changement de jour, un nouveau ticket « s’imprime ».
export default function TicketJour({ day, slots, onOpenEntry }) {
  const groups = groupBySlot(day.entries, slots);
  return (
    <div className="animate-imprimer">
      <Ticket>
        <TicketEntete titre="Mijote" as="h2" sousTitre={jourComplet(day.date).toUpperCase()} />
        <TicketTirets />
        {groups.length === 0 ? (
          <p className="py-4 text-center font-text text-lecture text-encre-2">
            Rien de prévu ce jour.
          </p>
        ) : (
          groups.map(({ slot, entries }) => (
            <div key={slot.id}>
              <TicketPartie>{slot.name}</TicketPartie>
              {entries.map((entry) => (
                <LigneEntree key={entry.id} entry={entry} onOpen={onOpenEntry} />
              ))}
            </div>
          ))
        )}
        {groups.length > 0 && (
          <>
            <TicketTirets />
            <TicketTotal valeur={formatNombre(day.totalCalories)} />
            <TicketLigne nom="dont protéines" valeur={`${formatNombre(day.totalProteins)} g`} />
            {day.unknownCount > 0 && (
              <p className="mt-2 font-text text-ui text-encre-2">
                {day.unknownCount} {day.unknownCount > 1 ? 'lignes' : 'ligne'} sans calories
                connues, non {day.unknownCount > 1 ? 'comptées' : 'comptée'} dans le total.
              </p>
            )}
          </>
        )}
        <CodeBarres />
      </Ticket>
    </div>
  );
}
