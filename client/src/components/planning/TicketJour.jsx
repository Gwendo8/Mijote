import { formatNombre, groupBySlot, papierDuCreneau } from '../../utils/planning.js';
import Ticket from '../ui/Ticket.jsx';
import LigneEntree from './LigneEntree.jsx';

// Le jour en tickets : un ticket par créneau, sur le papier de son créneau (beurre, menthe, pêche, ciel).
// Une pile sur téléphone, deux colonnes sur PC. Chaque ticket : le créneau, ses calories, une ligne par plat.
// `day` : { date, entries } ; `slots` : les créneaux de la semaine (leur rang donne la couleur du papier).
// La page met `key={date}` : à chaque changement de jour, les tickets « s’impriment ».
export default function TicketJour({ day, slots, onOpenEntry }) {
  const groups = groupBySlot(day.entries, slots);
  if (groups.length === 0) {
    return (
      <Ticket className="animate-imprimer">
        <p className="py-4 text-center font-text text-lecture text-encre-2">
          Rien de prévu ce jour.
        </p>
      </Ticket>
    );
  }
  return (
    <div className="animate-imprimer grid grid-cols-1 gap-2.5 lg:grid-cols-[repeat(2,minmax(0,1fr))] lg:gap-3">
      {groups.map(({ slot, entries }) => {
        const connues = entries.filter((entry) => entry.calories !== null);
        const total = connues.reduce((somme, entry) => somme + entry.calories, 0);
        return (
          <Ticket key={slot.id} papier={papierDuCreneau(slots.indexOf(slot))}>
            <div className="mb-2 flex items-baseline justify-between gap-2">
              <h2 className="text-[16px] font-bold">{slot.name}</h2>
              <span className="text-libelle font-semibold text-encre-2">
                {connues.length > 0 ? `${formatNombre(total)} kcal` : '?'}
              </span>
            </div>
            {entries.map((entry) => (
              <LigneEntree key={entry.id} entry={entry} onOpen={onOpenEntry} />
            ))}
          </Ticket>
        );
      })}
    </div>
  );
}
